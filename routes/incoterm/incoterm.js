import express from "express";
import createIncoterm from "./api/create.js";
import getIncoterm from "./api/get.js";

const incotermRouter = express.Router();

incotermRouter.use("/create", createIncoterm);
incotermRouter.use("/list", getIncoterm);

export default incotermRouter;
