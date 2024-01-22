import mongoose, {Schema } from "mongoose";
//import { jwt } from "jsonwebtoken";
import jwt from 'jsonwebtoken';
// const { jwt } = pkg;
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username : {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        fullname: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
        },
        coverImage: {
            type: String, //cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            }
        ],
        password: {
            type: String, 
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String,
        }

    },
    {
        timestamps: true
    }
)

//using pre hook to encrypt the password before saving (i.e, whenever the user hits the save button)

// but it has a prblm, whenever save button is hit for any changes, password is changed
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next(); //checks if the password is modified, if not next is returned
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

//checks if the password is correct
userSchema.methods.isPasswordCorrect = async function
(password){
   return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    //console.log("inside access method")
    return jwt.sign(
        {
            // console.log("inside access method"),
            _id: this.id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        //console.log("inside access method-2"),
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    //console.log("inside refresh method")
    return jwt.sign(
        {
            _id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema);