import express from "express";
import createGrade from "./api/create.js";
import getGrade from "./api/get.js";
import gradeUpdate from "./api/update.js";
import gradeDelete from "./api/delete.js";

const gradeRouter = express.Router();

gradeRouter.use("/create", createGrade);
gradeRouter.use("/list", getGrade);
gradeRouter.use("/edit", gradeUpdate);
gradeRouter.use("/delete", gradeDelete);



export default gradeRouter;
