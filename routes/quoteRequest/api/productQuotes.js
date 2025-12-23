import express from "express";
import quoteRequestController from "../../../controllers/quoteRequest.controller.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const productQuotesRouter = express.Router();

/**
 * @route   GET /api/quote/product-quotes/admin
 * @desc    Get all product quote requests for admin
 * @access  Private (Admin)
 * @query   status, search, page, limit, sortBy, sortOrder, startDate, endDate
 */
productQuotesRouter.get(
  "/admin",
  authenticateUser,
  quoteRequestController.getAdminQuoteRequests
);

/**
 * @route   POST /api/quote/product-quotes
 * @desc    Create a new product quote request
 * @access  Private (Buyer)
 */
productQuotesRouter.post("/", authenticateUser, quoteRequestController.createQuoteRequest);

/**
 * @route   GET /api/quote/product-quotes/seller
 * @desc    Get all product quote requests for seller
 * @access  Private (Seller)
 * @query   status, page, limit
 */
productQuotesRouter.get(
  "/seller",
  authenticateUser,
  quoteRequestController.getSellerQuoteRequests
);

/**
 * @route   GET /api/quote/product-quotes/buyer
 * @desc    Get all product quote requests for buyer
 * @access  Private (Buyer)
 * @query   status, page, limit
 */
productQuotesRouter.get(
  "/buyer",
  authenticateUser,
  quoteRequestController.getBuyerQuoteRequests
);

/**
 * @route   GET /api/quote/product-quotes/product/:productId
 * @desc    Get all quote requests for a specific product (seller only)
 * @access  Private (Seller)
 */
productQuotesRouter.get(
  "/product/:productId",
  authenticateUser,
  quoteRequestController.getQuotesByProductId
);

/**
 * @route   GET /api/quote/product-quotes/:id
 * @desc    Get single product quote request by ID
 * @access  Private (Buyer/Seller/Admin)
 */
productQuotesRouter.get("/:id", authenticateUser, quoteRequestController.getQuoteRequestById);

/**
 * @route   PATCH /api/quote/product-quotes/:id/status
 * @desc    Update product quote request status
 * @access  Private (Seller/Buyer)
 */
productQuotesRouter.patch(
  "/:id/status",
  authenticateUser,
  quoteRequestController.updateStatus
);

/**
 * @route   PATCH /api/quote/product-quotes/:id/respond
 * @desc    Seller responds to product quote request
 * @access  Private (Seller)
 */
productQuotesRouter.patch(
  "/:id/respond",
  authenticateUser,
  quoteRequestController.sellerRespond
);

/**
 * @route   DELETE /api/quote/product-quotes/:id
 * @desc    Delete product quote request
 * @access  Private (Buyer/Admin)
 */
productQuotesRouter.delete(
  "/:id",
  authenticateUser,
  quoteRequestController.deleteQuoteRequest
);

export default productQuotesRouter;
