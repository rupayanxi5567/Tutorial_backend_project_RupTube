import "dotenv/config";
import dns from "dns";
dns.setServers(["1.1.1.1"]);
import dotenv from "dotenv";
import connectDb from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: "./.env" });


connectDb()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running on http://localhost:${process.env.PORT}`);
    });
})
.catch( (e)=>{
    console.log(`MONGO DB CONNECTION FAILED: ${e}`);
})














































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