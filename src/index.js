// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";

// import express from "express"
// const app = express()

// // function connectDB(){}
// ( async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error", () => {
//             console.log("ERROR: ", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () =>{
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })

//     }catch(error){
//         console.log("ERROR: ",error);
//         throw error;
//     }
// })()

// require('dotenv').config({path: './env'})


import dotenv from "dotenv"
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: './env'
})

connectDB()
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is runnimg at port : ${process.env.PORT}`);
  })
})
.catch((err) => {
  console.log("MONGO DB connection failed !!! ", err);
})



















/*
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    
    // Add an event listener for unhandled promise rejections
    process.on('unhandledRejection', (error) => {
      console.error('Unhandled Rejection:', error);
      // Optionally, you might want to gracefully shut down the server or perform other cleanup here
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR: ", error);
    // Optionally, you might want to gracefully shut down the server or perform other cleanup here
    process.exit(1); // Exit the process with a failure code
  }
})();
*/
