import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import User from "../models/users.models.js";
import upload_on_cloudinary from "../utils/cloudnary.js"
import ApiResponse from "../utils/ApiResponse.js"

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
    // let coverImageLocalPath = req.files?.coverImage?.[0]?.path;

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
export {registerUser};
