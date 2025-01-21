import express from "express";
import productFamilyGet from "./api/get.js";
import productFamilyCreate from "./api/create.js";
import productFamilyUpdate from "./api/update.js";
import ProductFamilyDelete from "./api/delete.js";

const productFamilyRouter = express.Router();

productFamilyRouter.use("/list", productFamilyGet);
productFamilyRouter.use("/create", productFamilyCreate);
productFamilyRouter.use("/edit", productFamilyUpdate);
productFamilyRouter.use("/delete", ProductFamilyDelete);



export default productFamilyRouter;