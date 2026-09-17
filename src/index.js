import dns from "dns";
dns.setServers(["1.1.1.1"]);

// require("dotenv").config({path:"./env"});
import dotenv from "dotenv";
import connectDb from "./db/index.js";

dotenv.config({ path: "./env" });


connectDb();














































// import express from "express";

// let app = express()


// ;( async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
//         app.on("error",(e)=>{
//             console.log("Error connecting to the database: ",e)
//             throw e;
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`Server is running on port ${process.env.PORT}`)
//         })

//     }catch(err){
//         console.log(`ERROR: ${err}`)
//         throw err
//     }
// } ) ()