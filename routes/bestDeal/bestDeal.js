import express from "express";
import createBestDeal from "./api/offer.create.js";
import editBestDeal from "./api/offer.update.js";
import listBestDeals from "./api/offer.get.js";
import deleteBestDeal from "./api/offer.delete.js";
import listPendingDeals from "./admin/listPendingDeals.js";
import adminDecision from "./admin/approveOrRejectDeal.js";
import listApprovedDeals from "./admin/approvedDeals.js";



const bestDealRouter = express.Router();

bestDealRouter.use("/create", createBestDeal);
bestDealRouter.use("/delete", deleteBestDeal);
bestDealRouter.use("/list", listBestDeals);
bestDealRouter.use("/edit", editBestDeal);
bestDealRouter.use("/admin-list", listPendingDeals);
bestDealRouter.use("/admin-status", adminDecision);
bestDealRouter.use("/admin-approved", listApprovedDeals);


export default bestDealRouter;
listApprovedDeals