import express from "express";
import enquiryGet from "./api/get.js";
import enquiryCreate from "./api/create.js";
import enquiryDelete from "./api/delete.js";

const enquiryRouter = express.Router();

enquiryRouter.use("/list", enquiryGet);
enquiryRouter.use("/create", enquiryCreate);
enquiryRouter.use("/delete", enquiryDelete);

export default enquiryRouter;
