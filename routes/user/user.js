import express from "express";
import userList from "./api/list.js";
import verifyUser from "./api/verification.js";
import userEdit from "./api/update.js";
import getUserData from "./api/profile.js";
import sellerList from "./api/seller.list.js";
import buyerList from "./api/buyer.list.js";

const userRouter = express.Router();

userRouter.use("/list", userList);
userRouter.use("/verification", verifyUser);
userRouter.use("/edit", userEdit);
userRouter.use("/profile", getUserData);
userRouter.use("/seller", sellerList);
userRouter.use("/buyer", buyerList);








export default userRouter;