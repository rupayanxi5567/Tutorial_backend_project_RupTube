import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

let upload_on_cloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath){
            return null;
        }        
        let response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
        })
        // file has been uploaded successfully
        console.log(`FILE HAS BEEN UPLOADED SUCCESSFULLY TO CLOUDINARY!!!, ${response.url} `);
        return response;
    } catch (e) {
        fs.unlinkSync(localFilePath);
        return null;
        console.log(`ERROR OCCURED DURING UPLOADING TO CLOUDINARY: ${e}`);
    }
}

export default upload_on_cloudinary;