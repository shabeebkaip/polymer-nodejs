import express from "express";
import createAppearance from "./api/create.js";
import getAppearance from "./api/get.js";

const appearanceRouter = express.Router();

appearanceRouter.use("/create", createAppearance);
appearanceRouter.use("/list", getAppearance);

export default appearanceRouter;
