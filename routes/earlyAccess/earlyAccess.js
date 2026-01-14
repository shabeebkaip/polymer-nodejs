import express from "express";
import submitEarlyAccessRouter from "./api/submit.js";
import listEarlyAccessRouter from "./api/list.js";
import statisticsRouter from "./api/statistics.js";
import updateStatusRouter from "./api/updateStatus.js";
import deleteEarlyAccessRouter from "./api/delete.js";

const earlyAccessRouter = express.Router();

// Public endpoint - no auth required
earlyAccessRouter.use("/submit", submitEarlyAccessRouter);

// Admin endpoints - require authentication
earlyAccessRouter.use("/list", listEarlyAccessRouter);
earlyAccessRouter.use("/statistics", statisticsRouter);
earlyAccessRouter.use("/update-status", updateStatusRouter);
earlyAccessRouter.use("/delete", deleteEarlyAccessRouter);

export default earlyAccessRouter;
