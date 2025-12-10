import express from "express";
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  getCommentCount,
} from "../../controllers/sampleRequestComment.controller.js";
import { authenticateUser } from "../../middlewares/verify.token.js";

const router = express.Router();

/**
 * @route   POST /api/sample-request-comment/:sampleRequestId
 * @desc    Add a comment to a sample request
 * @access  Private (Buyer, Seller, Admin)
 */
router.post("/:sampleRequestId", authenticateUser, addComment);

/**
 * @route   GET /api/sample-request-comment/:sampleRequestId
 * @desc    Get all comments for a sample request
 * @access  Private (Buyer, Seller, Admin)
 */
router.get("/:sampleRequestId", authenticateUser, getComments);

/**
 * @route   GET /api/sample-request-comment/:sampleRequestId/count
 * @desc    Get comment count for a sample request
 * @access  Public
 */
router.get("/:sampleRequestId/count", getCommentCount);

/**
 * @route   PUT /api/sample-request-comment/update/:commentId
 * @desc    Update a comment
 * @access  Private (Comment Author, Admin)
 */
router.put("/update/:commentId", authenticateUser, updateComment);

/**
 * @route   DELETE /api/sample-request-comment/delete/:commentId
 * @desc    Delete a comment (soft delete)
 * @access  Private (Comment Author, Admin)
 */
router.delete("/delete/:commentId", authenticateUser, deleteComment);

export default router;
