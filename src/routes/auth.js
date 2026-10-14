import { Router } from "express";
import { generateNewRefreshToken, loginController, RegisterController } from "../controller/auth.js";
import {upload} from "../middleware/multer-storage.js";

const Authrouter = Router();
Authrouter.post("/register",upload.fields([
    {name: "profile_photo", maxCount:1},
    {name:"cover_photo", maxCount: 1}]),RegisterController);

Authrouter.post("/login", loginController);
Authrouter.post("/refresh", generateNewRefreshToken)

export default Authrouter;