import express from "express";
import categoryCreate from "./api/create.js";
import categoryUpdate from "./api/update.js";
import categoryDelete from "./api/delete.js";
import categoryGet from "./api/get.js";
import categoryName from "./api/categoryName.js";



const categoryRouter = express.Router();

categoryRouter.use("/create", categoryCreate);
categoryRouter.use("/list", categoryGet);
categoryRouter.use("/edit", categoryUpdate);
categoryRouter.use("/delete", categoryDelete);
categoryRouter.use("/", categoryName);


export default categoryRouter;
