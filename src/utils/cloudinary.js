import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import 'dotenv/config';
import fs from "fs";
cloudinary.config({ 
    cloud_name: 'bwcnm6p2', 
    api_key: '432183811483753', 
    api_secret: process.env.CLOUDNIARY_API_SECRET, 
});
dotenv.config();

// config

export const uploadFileToCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    console.log("File upload complete", response.url);
    console.log(filePath);
    fs.unlinkSync(filePath);
    return response.url;
  } catch (error) {
    console.log(error);
    fs.unlinkSync(filePath);
    return null;
  }
};