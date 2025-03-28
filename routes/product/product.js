import express from "express";
import productCreate from "./api/create.js";
import productDelete from "./api/delete.js";
import productGet from "./api/get.js";
import productUpdate from "./api/update.js";
import products from "./api/detail.js";
import productEntity from "./api/productEntity.js";

const productRouter = express.Router();

productRouter.use("/create", productCreate);
productRouter.use("/delete", productDelete);
productRouter.use("/list", productGet);
productRouter.use("/edit", productUpdate);
productRouter.use("/entity",productEntity)
productRouter.use("", products);

export default productRouter;
