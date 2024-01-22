import express from 'express';
import cors from "cors"
import cookieParser from 'cookie-parser';

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN, //to mention from which site of the frontend the backend could be accessed
    credentials: true
}))


// configuring: accepting the json
app.use(express.json({limit: "16kb"})) //how much to limit

//url encoder converts special character like space to some specific symbols 
// extended makes us to access inner ibjects
app.use(express.urlencoded({extended: true, limit: "16kb"})) 

// sometimes users want to store pdfs , images into the website(which means in the server i.e in the backend ), those will be stored in a common folder.
app.use(express.static("public"))


app.use(cookieParser()) // to store, read and set secure cookies of the server to the user's browser, which can be done only ny the server.


//routes import

import userRouter from './routes/user.routes.js'

//routes declaration

//earlier we have been using "app.get" as we were importing routes from the same files but here since we have separated every thing, we need to use middleware to bring routes hence using "app,use"

//for more see video no 13 and chat gpt

//app.use("/users", userRouter)

//when the user suffix is added to the end of the user, userRouter is called and it goes to the routes file, from there register func is called which take it to the controller file.
// for example
//http://localhost:8080/users
//http://localhost:8080/users/register

// if i want to call login func, changes will appear in the user.routes file as soon as /user is hit, the control is moved to the user.routes.js file

//standard practice

app.use("/api/v1/user", userRouter)

//as we are creating an api it is imp to specify it and the version number .
//http://localhost:8080/api/v1/users/register

export {app}