import express from "express";
import createBulkOrder from "./api/createBulkOrder.js";
import getAllBulkOrders from "./api/getAllBulkOrders.js";
import getUserBulkOrders from "./api/getUserBulkOrders.js";
import adminVerifyBulkOrder from "./api/adminVerifyBulkOrder.js";


const bulkOrderRouter = express.Router();

bulkOrderRouter.use("/create", createBulkOrder);
bulkOrderRouter.use("/admin-list", getAllBulkOrders);
bulkOrderRouter.use("/user-list", getUserBulkOrders);
bulkOrderRouter.use("/verify-status", adminVerifyBulkOrder);


export default bulkOrderRouter;
