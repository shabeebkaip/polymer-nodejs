import express from "express";
import sampleRequestController from "../../controllers/sampleRequest.controller.js";
import { authenticateUser } from "../../middlewares/verify.token.js";

const sampleRequestRouter = express.Router();

// Admin routes - view all sample requests
sampleRequestRouter.get("/admin", authenticateUser, sampleRequestController.getAdminRequests);

// Buyer routes - create and view their own requests
sampleRequestRouter.post("/create", authenticateUser, sampleRequestController.create);
sampleRequestRouter.get("/buyer", authenticateUser, sampleRequestController.getBuyerRequests);

// Seller routes - view requests for their products
sampleRequestRouter.get("/seller", authenticateUser, sampleRequestController.getSellerRequests);
sampleRequestRouter.get("/product/:productId", authenticateUser, sampleRequestController.getByProductId);
sampleRequestRouter.patch("/:id/status", authenticateUser, sampleRequestController.updateStatus);

// Common routes - get detail, delete
sampleRequestRouter.get("/:id", authenticateUser, sampleRequestController.getById);
sampleRequestRouter.delete("/:id", authenticateUser, sampleRequestController.delete);

export default sampleRequestRouter;
