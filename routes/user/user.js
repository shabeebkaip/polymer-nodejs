import express from "express";
import userList from "./api/list.js";
import verifyUser from "./api/verification.js";
import userEdit from "./api/update.js";
import getUserData from "./api/profile.js";

const userRouter = express.Router();

userRouter.use("/list", userList);
userRouter.use("/verification", verifyUser);
userRouter.use("/edit", userEdit);
userRouter.use("/profile", getUserData);






export default userRouter;