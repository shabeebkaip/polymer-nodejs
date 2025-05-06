import express from "express";
import createPolymerType from "./api/create.js";
import getPolymerType from "./api/get.js";
import updatePolymerType from "./api/update.js";
import deletePolymerType from "./api/delete.js";


const polymerTypeRouter = express.Router()

polymerTypeRouter.use("/create", createPolymerType);
polymerTypeRouter.use("/list", getPolymerType);
polymerTypeRouter.use("/update", updatePolymerType);
polymerTypeRouter.use("/delete", deletePolymerType);


export default physicalFormRouter