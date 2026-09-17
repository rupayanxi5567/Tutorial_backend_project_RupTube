import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

let connectDb=async()=>{
    try {
        let connectionInstances=await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`\nMONGODB CONNECTION SUCCESSFUL!!! DB HOST: ${connectionInstances.connection.host}`);
    } catch (error) {
        console.log(`MONGODB CONNECTION ERROR OCCURED: ${error}`);
        process.exit(1)
    }
}

export default connectDb;