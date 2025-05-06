import express from "express";
import createIncoterm from "./api/create.js";
import getIncoterm from "./api/get.js";
import incotermUpdate from "./api/update.js";
import incotermDelete from "./api/delete.js";

const incotermRouter = express.Router();

incotermRouter.use("/create", createIncoterm);
incotermRouter.use("/list", getIncoterm);
incotermRouter.use("/edit", incotermUpdate);
incotermRouter.use("/delete", incotermDelete);



export default incotermRouter;
