import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import User from "../models/users.models.js";
import upload_on_cloudinary from "../utils/cloudnary.js"
import ApiResponse from "../utils/ApiResponse.js"

let generateAccessAndRefreshToken = async (userId)=>{
    try {
        let user = await User.findById(userId);
        let acessToken = user.generateAccessTokens();
        let refreshToken = user.generateRefreshTokens();

        user.refreshTokens = refreshToken;
        await user.save({validateBeforeSave: false});

        return {acessToken,refreshToken}; 



    } catch (e) {
        throw new ApiError(500,"Something went wrong while generating refresh and acess token")
    }

}


let registerUser = asyncHandler( async (req,res)=>{
    
    let {username,email,fullname,passwords} = req.body

    if([username,email,fullname,passwords].some((fields)=>{
        return fields?.trim()===""})){

        throw new ApiError(400,"All fields are required!!!");

    }

    let isExist=await User.findOne({
        $or:[{ username },{ email }]
    })

    if(isExist){
        throw new ApiError(409,"User already exists!!!");
    }

    let avatarLocalPath = req.files?.avatar?.[0]?.path;

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){

        coverImageLocalPath = req.files.coverImage[0].path;

    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required!!!");
    }

    let avatarResponse = await upload_on_cloudinary(avatarLocalPath);
    if(!avatarResponse){
        throw new ApiError(400,"Avatar is required!!!");
    }
    let coverImageResponse = await upload_on_cloudinary(coverImageLocalPath);


    let user = await User.create({
        username:username.toLowerCase(),
        email,
        fullname,
        avatar:avatarResponse.url,
        coverImage : coverImageResponse?.url||"",
        passwords
    })

    let createdUser=await User.findById(user._id).select(
        "-passwords -refreshTokens"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user!!!");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
} )

let loginUser = asyncHandler(async (req,res)=>{
    let {email,username,passwords} = req.body;

    if(!email?.trim() && !username.trim()){
        throw new ApiError(400,"Atleast Username or Email is required!")
    }

    let foundUser = await User.findOne({
        $or:[{username},{email}]
    })

    if(!foundUser){
        throw new ApiError(404,"User does not exist!!!");
    }

    let isPasswordValid = await foundUser.isPasswordCorrect(passwords);

    if(!isPasswordValid){
        throw new ApiError(401,"Incorrect password!!!");
    }

    let {acessToken,refreshToken} = await generateAccessAndRefreshToken(foundUser._id);

    let loggedInUser = await User.findById(foundUser._id).select("-password -refreshTokens")

    let options = {
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .cookie("accessToken",acessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,acessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})

let logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshTokens:undefined,
            }
        },
        {
            new:true,
        }
    );    
    let options = {
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))

})

export {registerUser,loginUser,logoutUser};
