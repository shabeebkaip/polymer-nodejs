import express from "express";
import dealQuoteRequestController from "../../controllers/dealQuoteRequest.controller.js";
import { authenticateUser } from "../../middlewares/verify.token.js";

const dealQuoteRequestRouter = express.Router();

// Buyer routes - create and view their own requests
dealQuoteRequestRouter.post("/create", authenticateUser, dealQuoteRequestController.create);
dealQuoteRequestRouter.get("/buyer", authenticateUser, dealQuoteRequestController.getBuyerRequests);

// Seller routes - view requests assigned to them and respond
dealQuoteRequestRouter.get("/seller", authenticateUser, dealQuoteRequestController.getSellerRequests);
dealQuoteRequestRouter.get("/deal/:dealId", authenticateUser, dealQuoteRequestController.getByDealId);
dealQuoteRequestRouter.post("/:id/respond", authenticateUser, dealQuoteRequestController.sellerRespond);

// Common routes - get detail, update status, delete
dealQuoteRequestRouter.get("/:id", authenticateUser, dealQuoteRequestController.getById);
dealQuoteRequestRouter.patch("/:id/status", authenticateUser, dealQuoteRequestController.updateStatus);
dealQuoteRequestRouter.delete("/:id", authenticateUser, dealQuoteRequestController.delete);

export default dealQuoteRequestRouter;
