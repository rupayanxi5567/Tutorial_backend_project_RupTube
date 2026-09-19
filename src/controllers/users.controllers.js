import asyncHandler from "../utils/asyncHandler.js";

let registerUser = asyncHandler( async (req,res)=>{
    return res.status(200).json({
        message:"ok",
    });
} )
export {registerUser};
