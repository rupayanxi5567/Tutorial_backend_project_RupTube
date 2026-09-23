import mongoose, {Mongoose, Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "./users.models";

let subscriptionsSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref: "User",
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref: "User",
    },
},{timestamps:true});

export let Subscriptions = mongoose.model("Subscriptions",subscriptionsSchema);