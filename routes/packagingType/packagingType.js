import express from "express";
import createPhysicalForm from "../physicalForm/api/create";
import getPhysicalForm from "../physicalForm/api/get";
import updatePhysicalForm from "../physicalForm/api/update";
import deletePhysicalForm from "../physicalForm/api/delete";


const packagingTypeRouter = express.Router()

packagingTypeRouter.use("/create", createPhysicalForm);
packagingTypeRouter.use("/list", getPhysicalForm);
packagingTypeRouter.use("/update", updatePhysicalForm);
packagingTypeRouter.use("/delete", deletePhysicalForm);


export default packagingTypeRouter