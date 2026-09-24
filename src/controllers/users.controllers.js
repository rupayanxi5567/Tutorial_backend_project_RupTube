import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import User from "../models/users.models.js";
import upload_on_cloudinary from "../utils/cloudnary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

let generateAccessAndRefreshToken = async (userId) => {
    try {
        let user = await User.findById(userId);
        let acessToken = user.generateAccessTokens();
        let refreshToken = user.generateRefreshTokens();

        user.refreshTokens = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { acessToken, refreshToken };



    } catch (e) {
        throw new ApiError(500, "Something went wrong while generating refresh and acess token")
    }

}

let registerUser = asyncHandler(async (req, res) => {

    let { username, email, fullname, passwords } = req.body

    if ([username, email, fullname, passwords].some((fields) => {
        return fields?.trim() === ""
    })) {

        throw new ApiError(400, "All fields are required!!!");

    }

    let isExist = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (isExist) {
        throw new ApiError(409, "User already exists!!!");
    }

    let avatarLocalPath = req.files?.avatar?.[0]?.path;

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {

        coverImageLocalPath = req.files.coverImage[0].path;

    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required!!!");
    }

    let avatarResponse = await upload_on_cloudinary(avatarLocalPath);
    if (!avatarResponse) {
        throw new ApiError(400, "Avatar is required!!!");
    }
    let coverImageResponse = await upload_on_cloudinary(coverImageLocalPath);


    let user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        avatar: avatarResponse.url,
        coverImage: coverImageResponse?.url || "",
        passwords
    })

    let createdUser = await User.findById(user._id).select(
        "-passwords -refreshTokens"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user!!!");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

let loginUser = asyncHandler(async (req, res) => {
    let { email, username, passwords } = req.body;

    if (!email?.trim() && !username.trim()) {
        throw new ApiError(400, "Atleast Username or Email is required!")
    }

    let foundUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!foundUser) {
        throw new ApiError(404, "User does not exist!!!");
    }

    let isPasswordValid = await foundUser.isPasswordCorrect(passwords);

    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect password!!!");
    }

    let { acessToken, refreshToken } = await generateAccessAndRefreshToken(foundUser._id);

    let loggedInUser = await User.findById(foundUser._id).select("-password -refreshTokens")

    let options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", acessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, acessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
})

let logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshTokens: undefined,
            }
        },
        {
            new: true,
        }
    );
    let options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))

})

let refreshAccessToken = asyncHandler(async (req, res) => {
    let incomingRefreshToken = req.cookie.refreshTokens || req.body.refreshTokens;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }


    try {
        let decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        let user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshTokens) {
            throw new ApiError(401, "Refresh token is expired/used");
        }

        let options = {
            httpOnly: true,
            secure: true,
        };

        let { newAcessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", newAcessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        acessToken: newAcessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access token refreshed"
                )
            )
    } catch (e) {
        throw new ApiError(401, e?.message || "Invalid refresh token");
    }


})

let changeCurrentPassword = asyncHandler(async (req, res) => {
    let { oldPassword, newPassword, confPassword } = req.body;
    if (oldPassword !== confPassword) {
        throw new ApiError(400, "Passwords are not matching!!!");
    }
    let user = await User.findById(req.user?._id);
    let isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password");
    }
    user.passwords = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
})

let getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User fetched successfully"));
})

let updateUserDetails = asyncHandler(async (req, res) => {
    let { email, fullname } = req.body;
    if (!fullname && !email) {
        throw new ApiError(400, "Email and Fullname are required")
    }
    let user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email,
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));

})

let updateUserAvatar = asyncHandler(async (req, res) => {
    let avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }
    let avatar = await upload_on_cloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error occured while uploading on Avatar");
    }
    let user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, "Avatar updated successfully"));
})

let updateUserCoverImage = asyncHandler(async (req, res) => {
    let coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing");
    }
    let coverImage = await upload_on_cloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "Error occured while uploading on cover image");
    }
    let user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, "Cover image updated successfully"));
})

let getUserChannelProfile = asyncHandler(async (req, res) => {
    let { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }
    let channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase();
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }

    ]);
    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist!!!");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )

})

let getWatchHistory = asyncHandler(async(req,res)=>{
    let user = User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully")
    )
})








export { refreshAccessToken, registerUser, loginUser, logoutUser, changeCurrentPassword, getCurrentUser, updateUserDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile,getWatchHistory };
