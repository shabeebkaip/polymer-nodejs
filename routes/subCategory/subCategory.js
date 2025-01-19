import express from "express";
import subCategoryCreate from "./api/create.js";
import subCategoryGet from "./api/get.js";
import subCategoryUpdate from "./api/update.js";
import subCategoryDelete from "./api/delete.js";

const subCategoryRouter = express.Router();

subCategoryRouter.use("/list", subCategoryGet);
subCategoryRouter.use("/create", subCategoryCreate);
subCategoryRouter.use("/edit", subCategoryUpdate);
subCategoryRouter.use("/delete", subCategoryDelete);

export default subCategoryRouter;
