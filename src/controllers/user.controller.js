import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { jwt } from "jsonwebtoken";
import { response } from "express";
import mongoose from "mongoose";


/*
Function Definition:

generateAccessAndRefreshTokens is an asynchronous function that takes a userId as an argument.
It is designed to generate access and refresh tokens for a user identified by the provided userId.
Try Block:

Inside the try block, an attempt is made to find a user in the database using User.findById(userId).
The await keyword is used to make the asynchronous call, ensuring that the function waits for the User.findById operation to complete before moving on.
User Existence Check:

After retrieving the user, there's a check using if (!user) to determine if the user was not found in the database.
If the user is not found (!user is true), an ApiError is thrown with a 404 status code and a message indicating that the user was not found.
Token Generation (Placeholder):

If the user is found, you can see a comment indicating that you can continue with token generation logic or any other processing.
This is a placeholder for the actual logic to generate access and refresh tokens based on the retrieved user object.
Catch Block:

The catch block is executed if any errors occur during the try block.
It catches errors, and in this case, it throws an ApiError with a 500 status code and a generic error message if something goes wrong during the user retrieval or token generation process.

*/
const generateAccessAndRefreshTokens = async(userId) => {
  try {
      const user =  await User.findById(userId)

      //console.log(user)
      const accessToken = user.generateAccessToken()
      //console.log("accessToken:"+accessToken)
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      user.save({validateBeforeSave: false })

      return {accessToken, refreshToken}

  }catch(error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
  }
}

// const registerUser = asyncHandler( async (req, res) => {
//     res.status(200).json({
//         message: "ok"
//     })
// })

const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend --> 1
    // validation - not empty --> 2
    // check if user already exists : through username and email --> 3
    // check for images, check for avatar --> 4
    // upload them to cloudinary, avatar --> 5
    // create user object - create entry in db --> 6
    // remove password and refresh token field from response --> 7
    // check for user creation --> 8
    // return res --> 9


    //1

  const {fullname, email, username, password} = req.body
  //console.log("email: ", email);

  //using multiple if else statement we can specify each error separately

  // if  (fullname === "") {
  //     throw new ApiError(400, "fullname is required")
  // } 

  //if we are well informed about errors we can the following way

  //2

  if (
      [fullname, email, username, password].some((fields) => fields?.trim() === "")
  ) {
      throw new ApiError(400, "All fields are required")
  }
  //console.log(req.files);

  //here we are importing the User object from the user.model file, and using it to find (if any) the user with same username or email, if that exists. it will return true ot=r false, and the result will be stored in another const named existedUser

  //3

  const existedUser = await User.findOne({

      //using or operator, to check if username or email matches with any entry in the database
      $or: [{username}, {email}]
  })

  //if username or the email is already existing, then error will be thrown.
  if (existedUser) {
    throw new ApiError(409, "User already exists")
  }
  //console.log(req.files);

  //op
  /*
  [Object: null prototype] {
    avatar: [
      {
        fieldname: 'avatar',
        originalname: '2022-12-06.png',
        encoding: '7bit',
        mimetype: 'image/png',
        destination: './public/temp',
        filename: '2022-12-06.png',
        path: 'public\\temp\\2022-12-06.png',
        size: 1226559
      }
    ],
    coverImage: [
      {
        fieldname: 'coverImage',
        originalname: '2022-07-01 (2).png',
        encoding: '7bit',
        mimetype: 'image/png',
        destination: './public/temp',
        filename: '2022-07-01 (2).png',
        path: 'public\\temp\\2022-07-01 (2).png',
        size: 1268644
      }
    ]
  }
  */



  //here, the field has many fields like file type, jpg, png
  //using .path we are accesing the actual path that has been uploaded by multer,(specified in multer.middleware.js file), as when the user has git the send button, multer has already uploaded it in the given path

  //[0] means the first field may specify path, ? means if any, otherwise take the path as uploaded by multer

  //4

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //to check is cover image local path has been uploaded(as it is not necessarily), if yes then extract the path
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }




  //checking if the path is the specified path, otherwise throw error
  if ( !avatarLocalPath)
  {
    throw new ApiError(400, "Avatar file is required");
  }

  //uploading the avatar image on cloudinary server and as it may take time hence await is mentioned.

  //5

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //const avatar: This declares a constant variable named avatar to store the result of the awaited promise. The variable will hold the value resolved by the promise returned by uploadOnCloudinary.
  if ( !avatar)
  {
    throw new ApiError(400, "Avatar file is required");
  }

  //6

  const user = await User.create({
    fullname,
    avatar: avatar.url, //storing only the url of the avatar instead of the the whole object
    coverImage: coverImage?.url || "", //as we have not checked previously the coverimage has been uploaded or not (as it is not a compulsory field), so we are sending the coverimage uel if any or leaving it blank
    password,
    email,
    username: username.toLowerCase()

  })


  //7

  //check if the user has been uploaded in the database by searching by the id(assigned by mongoDb)
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" //The select method is used to specify which fields should be included or excluded in the query result. In this case, it is excluding the "password" and "refreshToken" fields from the retrieved user data.

  )

  //8

  if (!createdUser) {
    throw new ApiError(500,"Something went wrong while registering the user")
  }


  //9
  
  //sending response to the user, as we have already defined apiresponse object(the structure), we are sending the response by creating an instance of of the object
  return res.status(201).json(
    new ApiResponse(200, createdUser, " User registered Successfully")
  )

})


const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    //access and refresh token
    //send cookie

    const {email, username, password} = req.body

    //if ( !username || !email ) {
    if ( !username && !email)  {
      throw new ApiError, ("username or email is required")
    }

    //asking database for finding either username or email
    const user = await User.findOne({
      $or: [{username}, {email}]
    })

    if (!user)
    {
      throw new ApiError, (404,"User not found")
    }

    //checking if the password is correct, using user not User as the latter is a mongooose object, used to access mongodb functionality, but here we using our-defined functions, so using user.
    const isPasswordValid = await user.isPasswordCorrect(password)


if (!isPasswordValid)
{
  throw new ApiError, (401,"Invalid user credentials")
}

//console.log(user._id)

const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


const options = {
  httpOnly: true,
  secure: true
}

return res
.status(200)
.cookie("accessToken", accessToken,options)
.cookie("refreshToken", refreshToken, options)
.json(
  new ApiResponse(
    200,
    {
      user: loggedInUser, accessToken, refreshToken
    },
    "User logged in successfully"
  )
)
//similar to ApiResponse

})

const logoutUser = asyncHandler( async(req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => 
{
  const incomingRefreshToken = cookies.refreshToken || req.body.refreshToken 
  //This line initializes incomingRefreshToken by checking if cookies.refreshToken exists; if not, it falls back to req.body.refreshToken. It's trying to extract the refresh token from either cookies or the request body.

  if( incomingRefreshToken ) {
    throw new ApiError(401,"Unaithorised request")
  }

  //This line checks if incomingRefreshToken exists. If not, it throws an ApiError with a 401 status and the message "Unauthorized request."

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    //This line attempts to verify the incoming refresh token using the jwt.verify method, using the secret stored in the environment variable REFRESH_TOKEN_SECRET. The result is stored in decodedToken.
  
    const user = await User.findById(decodedToken?._id)

    //This line attempts to find a user in the database based on the user ID extracted from the decoded token. It uses the await keyword to wait for the asynchronous operation to complete.
    
    if( !user ) {
      throw new ApiError(401,"invalid request token")
    }
    //If no user is found based on the decoded token, it throws an ApiError with a 401 status and the message "Invalid request token."
  
    if (incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh is expired or used")
    }
    //This line checks if the incoming refresh token matches the one stored in the user object. If not, it throws an ApiError with a 401 status and the message "Refresh is expired or used."
  
    const options = {
      httoOnly: true,
      secure: true
    }
    //This line defines the options object for setting cookies, indicating that the cookies should be marked as httpOnly and secure
  
    const {accessToken, newresfrehToken}=await generateAccessAndRefreshTokens(user._id)
    //This line calls a function generateAccessAndRefreshTokens with the user ID and awaits its result. It destructures the result to get accessToken and newresfrehToken.
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newresfrehToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: newresfrehToken},
        "Access token refreshed"
      )
    )
    //This line sends a response back to the client with a 200 status. It sets two cookies, "accessToken" and "refreshToken," and sends a JSON response with a success message and the new access and refresh tokens.
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async(req,res) => {
  const {oldPassword, newPassword} = req.body //while changing the password, generally old password and the new password is needed, if want, confirm new password field can also be added then we have to check if the new password == confirm new password

  const user = await User.findById(req.user?._id) //in the auth.middleware, the verified user resides in req.user ,hence finding the user by its id.

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) // method described in the user.model.js file, to check is the password is correct

  if (!isPasswordCorrect)
  {
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword //setting the new password in the user.model.js file,  line 62-66
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200,user, "Password changed successfully" ))
})

//to get the current user, on hiiting the req button, user is loaded 
const getCurrentUser = asyncHandler(async(req,res) => {
  return res
  .status(200)
  .json(200, req.user, "current user fetched successfully")

})

const updateAccountDetails = asyncHandler(async(req,res) => {
  const {fullname, email} = req.body
  
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required")
  }

  const user= User.findByIdAndUpdate( 
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email
      }
    },
    {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated"))
  })

const updateUserAvatar = asyncHandler(async(req, res) =>
{
  const avatarLocalPath = req.file?.path //getting from multer middleware

  if(!avatarLocalPath)
  {
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url) {
    throw new ApiError(400,"Error while uploading on avatar")
  }

  const user =await User.findByIdAndUpdate(
    req.user?._id,

    {
      avatar: avatar.url //to store avatar url as in the avatar const, the whole avatar is stored
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .jsaon(new ApiResponse(200, user, "Avatar updated successfully"))

})

const updateUserCoverImage = asyncHandler(async(req, res) =>
{
  const coverImageLocalPath = req.file?.path //getting from multer middleware

  if(!coverImageLocalPath)
  {
    throw new ApiError(400,"Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage.url) {
    throw new ApiError(400,"Error while uploading on cover image")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      coverImage: coverImage.url //to store avatar url as in the avatar const, the whole avatar is stored
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .jsaon(new ApiResponse(200, user, "Cover image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async(req,res)=>
{
  const {username} = req.params //generally we get profile /info of any channel through its url, which will be recieved through the params 

  if(!username?.trim())
  {
    throw new ApiError(400, "username is missing")
  } 

  //in the below way, we can find the username from the database and then pass it to get the id then aggregate but we can do the same using the aggregate function

  //User.find({username})
  
  //these are pipelines
  const channel = await User.aggregate([
    {
      //t filters documents based on the specified condition. In this case, it matches documents where the username field is equal to the provided username (case-insensitive due to .toLowerCase()).
      $match: {
        username: username?.toLowerCase()
      }
    },
    //for no of subscribers
    {
      $lookup :{
        from:"subscription",
        localField: "_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    //for no of subscribed channels
    {
      $lookup:{
        from:"subscription",
        localField: "_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      //adding new fields to the original user model
      $addFields: {
        subscribersCount: {
          $size:"$subscribers"
        },
        channelsSubscribedToCount : {
           $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond: {
            if: {$in : [req.user?._id, "subscribers.subscriber"]},
            then:true,
            else:false
          }
        }

      }
    },
    //In MongoDB's aggregation framework, the $project stage is used to reshape documents by including, excluding, or transforming fields. It allows you to specify which fields from the input documents should be included in the output documents and how they should be presented.
    {
      $project: {
        fullname:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        avatar:1,
        coverImage:1
      }
    }
    //This $project stage is used to shape the output documents by including specific fields
    //The 1 in each field specifies that the corresponding field should be included in the output. If you wanted to exclude a field, you would use 0 instead of 1.
  ])

  if(!channel?.length)
  {
    throw new ApiError(404, "Channel does not exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User channel fetched successfully")
  )
})

const getWatchHistory = asyncHandler(async(req,res) => {
  const user = await User.aggregate([
    {
      $match: {
        //to return the user id , thats stored in the req
        _id: new mongoose.Types.ObjectId(req.user._id) //req.user._id returns the string part of the mongodb id but mongoose internally converts it to the mongodb id and returns the same.
        //whereas inside the aggregate function, mongodb works directly hence the defined way
      }
    },
    {
      //to access the history, we need nested pipeline : while taking video ids from the video model, info about the owner is also needed, hence pipeline lookup to owner, about owner, only few fields needed to be shown hence pipeline inside it.
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname: 1,
                    username:1,
                    avatar:1,

                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner : {
                $first : "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(new ApiResponse(200, user[0].watchHistory,"watchHistoryFetched"))
})

export {
  registerUser, 
  logoutUser, 
  loginUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}