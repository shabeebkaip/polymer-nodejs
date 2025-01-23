import express from "express";
import brandCreate from "./api/create.js";
import brandDelete from "./api/delete.js";
import brandGet from "./api/get.js";
import brandUpdate from "./api/update.js";

const brandRouter = express.Router();

brandRouter.use("/create", brandCreate);
brandRouter.use("/delete", brandDelete);
brandRouter.use("/list", brandGet);
brandRouter.use("/edit", brandUpdate);

export default brandRouter;
