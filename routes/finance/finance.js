import express from "express";
import financeRequestRouter from "./api/create.js";
import financeList from "./api/list.js";
import financeRequestStatus from "./api/status.update.js";
import getUserFinance from "./api/history.js";
import updateFinanceRouter from "./api/update.js";
import deleteFinanceRouter from "./api/delete.js";
import getFinanceDetail from "./api/detail.js";

const financeRouter = express.Router();
financeRouter.use("/create", financeRequestRouter);
financeRouter.use("/list", financeList);
financeRouter.use("/status", financeRequestStatus);
financeRouter.use("/history", getUserFinance);
financeRouter.use("/history", getFinanceDetail);
financeRouter.use("/edit", updateFinanceRouter);
financeRouter.use("/delete", deleteFinanceRouter);

export default financeRouter;
