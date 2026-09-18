import mongoose, {Mongoose, Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";




let userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
    },
    avatar:{
        type:String,
        required:true,
        trim:true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Videos",
        }
    ],
    passwords:{
        type:String,
        required:[true,'Password is required'],
    },
    refreshTokens:{
        type:String,

    }

},{timeseries:true});

userSchema.pre("save",async function(next){
    if(!this.isModified("passwords")){
        return next();
    }
    this.passwords=bcrypt.hash(this.passwords,10);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.passwords)
}

userSchema.methods.generateAccessTokens=function(){
    return jwt.sign(
        {
            _id: this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}
userSchema.methods.generateRefreshTokens=function(){
        return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export let User = mongoose.model("User",userSchema);