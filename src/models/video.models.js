import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


let videoSchema=new Schema({
    videoFile:{
        type:String,
        required:true,
    },
    thumbnail:{
        type:String,
        required:true,
    },
    title:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    descriptions:{
        type:String,
        required:true,
    },
    durations:{
        type:Number,
        required:true,
    },
    durations:{
        type:Number,
        required:true,
        default:0
    },
    isPublished:{
        type:Boolean,
        required:true,
        default:true,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    }
},{timestamps:true});


videoSchema.plugin(mongooseAggregatePaginate);

export let Videos=mongoose.model("Videos",videoSchema);