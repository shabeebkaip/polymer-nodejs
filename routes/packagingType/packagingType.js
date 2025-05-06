import express from "express";

import createPackagingType from "./api/create.js";
import updatePackagingType from "./api/update.js";
import deletePackagingType from "./api/delete.js";
import getPackagingType from "./api/get.js";


const packagingTypeRouter = express.Router()

packagingTypeRouter.use("/create", createPackagingType);
packagingTypeRouter.use("/edit", updatePackagingType);
packagingTypeRouter.use("/delete", deletePackagingType);
packagingTypeRouter.use("/list", getPackagingType);


export default packagingTypeRouter