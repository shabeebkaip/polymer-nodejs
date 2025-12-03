import express from "express";
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  getCommentCount,
} from "../../controllers/dealQuoteComment.controller.js";
import { authenticateUser } from "../../middlewares/verify.token.js";

const router = express.Router();

/**
 * @route   POST /api/deal-quote-comment/:dealQuoteRequestId
 * @desc    Add a comment to a deal quote request
 * @access  Private (Buyer, Seller, Admin)
 */
router.post("/:dealQuoteRequestId", authenticateUser, addComment);

/**
 * @route   GET /api/deal-quote-comment/:dealQuoteRequestId
 * @desc    Get all comments for a deal quote request
 * @access  Private (Buyer, Seller, Admin)
 */
router.get("/:dealQuoteRequestId", authenticateUser, getComments);

/**
 * @route   GET /api/deal-quote-comment/:dealQuoteRequestId/count
 * @desc    Get comment count for a deal quote request
 * @access  Public
 */
router.get("/:dealQuoteRequestId/count", getCommentCount);

/**
 * @route   PUT /api/deal-quote-comment/update/:commentId
 * @desc    Update a comment
 * @access  Private (Comment Author, Admin)
 */
router.put("/update/:commentId", authenticateUser, updateComment);

/**
 * @route   DELETE /api/deal-quote-comment/delete/:commentId
 * @desc    Delete a comment (soft delete)
 * @access  Private (Comment Author, Admin)
 */
router.delete("/delete/:commentId", authenticateUser, deleteComment);

export default router;
