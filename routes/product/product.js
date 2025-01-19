import express from "express";
import productCreate from "./api/create.js";
import productDelete from "./api/delete.js";
import productGet from "./api/get.js";
import productUpdate from "./api/update.js";
import productDetail from "./api/detail.js";

const productRouter = express.Router();

productRouter.use("", productCreate);
productRouter.use("", productDelete);
productRouter.use("", productGet);
productRouter.use("", productUpdate);
productRouter.use("", productDetail);

export default productRouter;
