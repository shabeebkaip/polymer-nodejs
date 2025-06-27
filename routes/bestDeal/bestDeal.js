import express from "express";
import createBestDeal from "./api/offer.create.js";
import editBestDeal from "./api/offer.update.js";
import listBestDeals from "./api/offer.get.js";
import deleteBestDeal from "./api/offer.delete.js";
import listPendingDeals from "./admin/listPendingDeals.js";
import adminDecision from "./admin/approveOrRejectDeal.js";
import listApprovedDeals from "./admin/approvedDeals.js";
import adminEditBestDeal from "./admin/adminEditBestDeal.js";
import adminCreateBestDeal from "./admin/adminCreateBestDeal.js";
import verifyDealQuote from "./api/dealQuoteAdminVerify.js";
import listApprovedQuotes from "./api/dealQuoteApprovedAdmin.js";
import createDealQuoteRequest from "./api/dealQuoteCreateBuyer.js";
import listAllDealQuotes from "./api/dealQuoteAdminList.js";
import adminGetUsers from "./admin/getAdminUsers.js";
import listDealQuotesForSeller from "./api/listDealQuoteSeller.js";
import verifyDealQuoteBySeller from "./api/verifyDealQuote.js";



const bestDealRouter = express.Router();

bestDealRouter.use("/create", createBestDeal);
bestDealRouter.use("/delete", deleteBestDeal);
bestDealRouter.use("/list", listBestDeals);
bestDealRouter.use("/edit", editBestDeal);
bestDealRouter.use("/admin-list", listPendingDeals);
bestDealRouter.use("/admin-status", adminDecision);
bestDealRouter.use("/admin-approved", listApprovedDeals);
bestDealRouter.use("/admin-create", adminCreateBestDeal);
bestDealRouter.use("/admin-edit", adminEditBestDeal);
bestDealRouter.use("/buyer-deal-quote", createDealQuoteRequest);
bestDealRouter.use("/buyer-deal-verify", verifyDealQuote);
bestDealRouter.use("/buyer-deal-approved", listApprovedQuotes);
bestDealRouter.use("/buyer-deal-admin", listAllDealQuotes);
bestDealRouter.use("/admin-users", adminGetUsers);
bestDealRouter.use("/deal-quote", listDealQuotesForSeller);
bestDealRouter.use("/deal-quote", verifyDealQuoteBySeller);


export default bestDealRouter;
