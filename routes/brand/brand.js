import express from "express";
import brandCreate from "./api/create.js";
import brandDelete from "./api/delete.js";
import brandGet from "./api/get.js";
import brandUpdate from "./api/update.js";

const brandRouter = express.Router();

brandRouter.use("", brandCreate);
brandRouter.use("", brandDelete);
brandRouter.use("/list", brandGet);
brandRouter.use("", brandUpdate);

export default brandRouter;
