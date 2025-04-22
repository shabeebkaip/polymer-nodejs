import express from "express";
import sampleRequestRouter from "./api/sample.js";
import quoteRequestRouter from "./api/quote.js";

const requestRouter = express.Router();

requestRouter.use("/sample", sampleRequestRouter);
requestRouter.use("/quote", quoteRequestRouter); // Assuming you have a quote request router

export default requestRouter;
