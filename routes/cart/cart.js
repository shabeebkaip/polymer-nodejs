import express from "express";
import cartCreate from "./api/cart.create.js";
import cartList from "./api/user.cart.list.js";
import cartDelete from "./api/cart.delete.js";


const cartRouter = express.Router();

cartRouter.use("/create", cartCreate);
cartRouter.use("/list", cartList);
cartRouter.use("/delete", cartDelete);




export default cartRouter;