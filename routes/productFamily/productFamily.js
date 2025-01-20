import express from "express";
import productFamilyGet from "./api/get.js";
import productFamilyCreate from "./api/create.js";

const productFamilyRouter = express.Router();

productFamilyRouter.use("/list", productFamilyGet);
productFamilyRouter.use("/create", productFamilyCreate);



export default productFamilyRouter;