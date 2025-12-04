import express from "express";
import quoteCommentController from "../../../controllers/quoteComment.controller.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const quoteCommentRouter = express.Router();

/**
 * @route   POST /api/quote/product-quotes/comments
 * @desc    Create a new comment on a product quote request
 * @access  Private (Buyer/Seller)
 */
quoteCommentRouter.post(
  "/",
  authenticateUser,
  quoteCommentController.createComment
);

/**
 * @route   GET /api/quote/product-quotes/comments/:quoteRequestId
 * @desc    Get all comments for a product quote request
 * @access  Private (Buyer/Seller/Admin)
 * @query   page, limit, includeDeleted
 */
quoteCommentRouter.get(
  "/:quoteRequestId",
  authenticateUser,
  quoteCommentController.getComments
);

/**
 * @route   PATCH /api/quote/product-quotes/comments/:commentId
 * @desc    Update a comment
 * @access  Private (Comment Author/Admin)
 */
quoteCommentRouter.patch(
  "/:commentId",
  authenticateUser,
  quoteCommentController.updateComment
);

/**
 * @route   DELETE /api/quote/product-quotes/comments/:commentId
 * @desc    Delete a comment (soft delete)
 * @access  Private (Comment Author/Admin)
 */
quoteCommentRouter.delete(
  "/:commentId",
  authenticateUser,
  quoteCommentController.deleteComment
);

export default quoteCommentRouter;
