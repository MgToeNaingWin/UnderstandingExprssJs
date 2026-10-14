import express from "express";
import cors from "cors";
import router from "./routes/test.js";
import cookieParser from "cookie-parser";
import Authrouter from "./routes/auth.js";

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/test", router);
app.use("/api/testerv19", Authrouter);
app.use("/ref" , Authrouter);
app.use("/log" , Authrouter);

export { app };