import express from "express";
import createSubstance from "./api/create.js";
import getSubstance from "./api/get.js";
const substanceRouter = express.Router();

substanceRouter.use("/create", createSubstance);
substanceRouter.use("/list", getSubstance);

export default substanceRouter;
