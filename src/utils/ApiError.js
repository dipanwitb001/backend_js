class ApiError extends Error {
    constructor(
        statusCode,
        message="Something went wrong",
        errors = [],
        stack = ""

    ){
        //overriding the default function
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors


        //to capture the exact location of the error
        if (stack ) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}