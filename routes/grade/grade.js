import express from "express";
import createGrade from "./api/create.js";
import getGrade from "./api/get.js";

const gradeRouter = express.Router();

gradeRouter.use("/create", createGrade);
gradeRouter.use("/list", getGrade);

export default gradeRouter;
