import express from "express";
import userList from "./api/get.js";

const userRouter = express.Router();

userRouter.use("/list", userList);



export default userRouter;