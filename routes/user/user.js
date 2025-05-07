import express from "express";
import userList from "./api/get.js";
import verifyUser from "./api/verification.js";

const userRouter = express.Router();

userRouter.use("/list", userList);
userRouter.use("/verification", verifyUser);




export default userRouter;