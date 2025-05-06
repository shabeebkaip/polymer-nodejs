import express from "express";


const packagingTypeRouter = express.Router()

packagingTypeRouter.use("/create", createPhysicalForm);
packagingTypeRouter.use("/list", getPhysicalForm);
packagingTypeRouter.use("/update", updatePhysicalForm);
packagingTypeRouter.use("/delete", deletePhysicalForm);


export default packagingTypeRouter