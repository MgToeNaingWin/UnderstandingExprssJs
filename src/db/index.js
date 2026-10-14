import mongoose  from "mongoose";

const DB_NAME  = "express";

export  const connectDB = async()=>{
    try{
        const connectionResponse  = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("Connected Successfully" , connectionResponse.connection.host);
    }catch(error){
        console.log("The Connection error" , error);
        process.exit(1);
    }
}