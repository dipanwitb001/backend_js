import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {

        //creating an unique suffix to create a temporary unique file name to store in the local server temporarily.



    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)


        //cb : callback function, setting the file name with the new suffix, we can keep the file nameas it is thw=e user as uploaded

     //cb(null, file.fieldname + '-' + uniqueSuffix)

     //we are keeping the file nameas it is thw=e user as uploaded
     cb(null, file.originalname)
    }
  })
  
export const upload = multer({
     storage
})