import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


let upload_on_cloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath){
            return null;
        }
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        let response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
        })
        // file has been uploaded successfully
        console.log(`FILE HAS BEEN UPLOADED SUCCESSFULLY TO CLOUDINARY!!!, ${response.url} `);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (e) {
        console.log(`ERROR OCCURED DURING UPLOADING TO CLOUDINARY: ${e}`);
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

export default upload_on_cloudinary;