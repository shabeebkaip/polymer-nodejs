import express from "express";
import createBulkOrder from "./api/createBulkOrder.js";
import getAllBulkOrders from "./api/getAllBulkOrders.js";
import getUserBulkOrders from "./api/getUserBulkOrders.js";
import adminVerifyBulkOrder from "./api/adminVerifyBulkOrder.js";
import getApprovedBulkOrders from "./api/adminApprovedOrders.js";
import editBulkOrderByAdmin from "./api/adminEditOrder.js";
import adminCreateBulkOrder from "./api/adminCreateOrder.js";
import createSupplierOffer from "./api/supplierOfferCreate.js";
import listSupplierOffers from "./api/getSupplierOfferAdmin.js";
import verifySupplierOffer from "./api/verifySupplyOfferAdmin.js";
import getApprovedSupplierOffers from "./api/getApprovedSupplier.js";
import adminProductList from "./api/adminProductList.js";


const bulkOrderRouter = express.Router();

bulkOrderRouter.use("/create", createBulkOrder);
bulkOrderRouter.use("/admin-list", getAllBulkOrders);
bulkOrderRouter.use("/user-list", getUserBulkOrders);
bulkOrderRouter.use("/verify-status", adminVerifyBulkOrder);
bulkOrderRouter.use("/admin-approved", getApprovedBulkOrders);
bulkOrderRouter.use("/admin-create", adminCreateBulkOrder);
bulkOrderRouter.use("/admin-edit", editBulkOrderByAdmin);
bulkOrderRouter.use("/supplier-offer", createSupplierOffer);
bulkOrderRouter.use("/supplier-offer", listSupplierOffers);
bulkOrderRouter.use("/supplier-offer", verifySupplierOffer);
bulkOrderRouter.use("/supplier-offer", getApprovedSupplierOffers);
bulkOrderRouter.use("/admin-product", adminProductList);




export default bulkOrderRouter;
