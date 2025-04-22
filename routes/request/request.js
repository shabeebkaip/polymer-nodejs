import express from "express";
import sampleRequestRouter from "./api/sample.js";

const requestRouter = express.Router();

requestRouter.use("/sample", sampleRequestRouter);

export default requestRouter;
