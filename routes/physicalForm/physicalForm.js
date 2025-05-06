import express from "express";
import createPhysicalForm from "./api/create.js";
import getPhysicalForm from "./api/get.js";
import deletePhysicalForm from "./api/delete.js";
import updatePhysicalForm from "./api/update.js";


const physicalFormRouter = express.Router()

physicalFormRouter.use("/create", createPhysicalForm);
physicalFormRouter.use("/list", getPhysicalForm);
physicalFormRouter.use("/update", updatePhysicalForm);
physicalFormRouter.use("/delete", deletePhysicalForm);


export default physicalFormRouter