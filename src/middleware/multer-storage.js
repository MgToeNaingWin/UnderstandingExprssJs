import multer from "multer";

const storage  = multer.diskStorage(
  {
    destination : function (req , file,cb){
      cb(null, "./public")
    },
    filename: function (req, file, cb ) {
        const uniqueSuffix = Date.now()+"-"+Math.round(Math.random * 1e9);
        const fileExtension = file.originalname.split(".")[1];
        const SureName = `${file.fieldname}-${uniqueSuffix}.${fileExtension}`;
        cb(null,SureName);
    }
  }); 
  
export const upload = multer({ storage }); 