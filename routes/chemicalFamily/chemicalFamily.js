
import express from "express";import chemicalFamilyGet from "./api/get.js";
import chemicalFamilyCreate from "./api/create.js";
import chemicalFamilyUpdate from "./api/update.js";
import chemicalFamilyDelete from "./api/delete.js";

const chemicalFamilyRouter = express.Router();

chemicalFamilyRouter.use("/list", chemicalFamilyGet);
chemicalFamilyRouter.use("/create", chemicalFamilyCreate);
chemicalFamilyRouter.use("/edit", chemicalFamilyUpdate)
chemicalFamilyRouter.use("/delete", chemicalFamilyDelete)


export default chemicalFamilyRouter;