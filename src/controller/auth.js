import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.js";
import fs from "fs";
import jwt from "jsonwebtoken";

export const RegisterController = async (req, res) => {
  const { username, email, password } = req.body;

  if ([username, email, password].some((field) => field?.trim() === "")) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const profile_photo_path = req.files?.profile_photo?.[0]?.path;
  const cover_photo_path = req.files?.cover_photo?.[0]?.path;

  if (!profile_photo_path || !cover_photo_path) {
    return res.status(400).json({ message: "Profile and cover photos are required." });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (fs.existsSync(profile_photo_path)) fs.unlinkSync(profile_photo_path);
      if (fs.existsSync(cover_photo_path)) fs.unlinkSync(cover_photo_path);
      return res.status(409).json({ message: "Email or username already exists." });
    }

    const profilePhotoRes = await uploadFileToCloudinary(profile_photo_path);
    const coverPhotoRes = await uploadFileToCloudinary(cover_photo_path);

    const user = await User.create({
      email,
      username: username.toLowerCase(),
      password,
      profile_photo: profilePhotoRes?.secure_url || "",
      cover_photo: coverPhotoRes?.secure_url || "",
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refresh_token"
    );

    if (!createdUser) {
      return res
        .status(500)
        .json({ message: "Something went wrong in registering new user." });
    }

    return res
      .status(200)
      .json({ userInfo: createdUser, message: "Registration is success." });
  } catch (error) {
    console.log("Registration error:", error);
    
    // Safe cleanup in case of crash
    if (profile_photo_path && fs.existsSync(profile_photo_path)) {
      fs.unlinkSync(profile_photo_path);
    }
    if (cover_photo_path && fs.existsSync(cover_photo_path)) {
      fs.unlinkSync(cover_photo_path);
    }

    return res.status(500).json({ message: "Something went wrong during registration." });
  }
};

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const existingUser = await User.findById(userId);
    if (!existingUser) return null;

    const accessToken = existingUser.generateAccessToken();
    const refreshToken = existingUser.generateRefreshToken();

    existingUser.refresh_token = refreshToken;
    await existingUser.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("Token generation error:", error);
    return null;
  }
};

export const loginController = async (req, res) => {
  const { email, username, password } = req.body;

  // ✅ FIXED: Allow login with either email or username + password
  if ((!email && !username) || !password) {
    return res.status(400).json({ message: "Email/Username and password are required." });
  }

  const existingUser = await User.findOne({
    $or: [{ username: username || "" }, { email: email || "" }],
  });

  if (!existingUser) {
    return res.status(404).json({ message: "No user found." });
  }

  const isPassMatch = await existingUser.isPasswordMatch(password);

  if (!isPassMatch) {
    return res.status(401).json({ message: "Invalid Credentials." });
  }

  const tokens = await generateAccessTokenAndRefreshToken(existingUser._id);
  if (!tokens) {
    return res.status(500).json({ message: "Failed to generate tokens." });
  }

  const { accessToken, refreshToken } = tokens;

  const loggedUser = await User.findById(existingUser._id).select(
    "-password -refresh_token"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({ user: loggedUser, message: "Login success." });
};

export const generateNewRefreshToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "No refresh token provided." });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET_KEY
    );

    const existingUser = await User.findById(decodedToken?._id);
    if (!existingUser || incomingRefreshToken !== existingUser.refresh_token) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const tokens = await generateAccessTokenAndRefreshToken(existingUser._id);
    if (!tokens) {
      return res.status(500).json({ message: "Failed to refresh tokens." });
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    return res
      .status(200)
      .cookie("accessToken", tokens.accessToken, options)
      .cookie("refreshToken", tokens.refreshToken, options)
      .json({ message: "Token updated." });
  } catch (error) {
    console.log("Refresh token error:", error);
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};

export const logoutController = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized request." });
  }

  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refresh_token: 1,
        },
      },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ message: `${req.user.username} logged out successfully.` });
  } catch (error) {
    console.log("Logout error:", error);
    return res.status(500).json({ message: "Something went wrong during logout." });
  }
};