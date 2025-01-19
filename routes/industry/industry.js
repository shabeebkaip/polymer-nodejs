import express from "express";
import createIndustry from "./api/create.js";
import getIndustry from "./api/get.js";
import updateIndustry from "./api/update.js";
import deleteIndustry from "./api/delete.js";

const industryRouter = express.Router();

industryRouter.use("/create", createIndustry);
industryRouter.use("/list", getIndustry);
industryRouter.use("/update", updateIndustry);
industryRouter.use("/delete", deleteIndustry);

export default industryRouter;
