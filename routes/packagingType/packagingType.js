import express from "express";

import createPackagingType from "./api/create.js";


const packagingTypeRouter = express.Router()

packagingTypeRouter.use("/create", createPackagingType);



export default packagingTypeRouter