import sampleRequestCommentRepository from "../repositories/sampleRequestComment.repository.js";
import sampleRequestRepository from "../repositories/sampleRequest.repository.js";
import Product from "../models/product.js";

/**
 * Add a comment to a sample request
 */
export const addComment = async (req, res) => {
  try {
    const { sampleRequestId } = req.params;
    const { comment, attachments } = req.body;
    const userId = req.user.id;
    const userRole = req.user.user_type;

    // Validation
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    if (comment.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 2000 characters",
      });
    }

    // Check if sample request exists
    const sampleRequest = await sampleRequestRepository.findById(sampleRequestId, [
      {
        path: "product",
        select: "createdBy",
      },
    ]);

    if (!sampleRequest) {
      return res.status(404).json({
        success: false,
        message: "Sample request not found",
      });
    }

    // Check if user has access (buyer, seller, or admin)
    const buyerId = sampleRequest.user.toString();
    const sellerId = sampleRequest.product.createdBy.toString();
    const userIdString = userId.toString();

    const hasAccess =
      userRole === "admin" ||
      buyerId === userIdString ||
      sellerId === userIdString;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to comment on this sample request",
      });
    }

    // Determine comment role
    let commentRole = "buyer";
    if (userRole === "admin") {
      commentRole = "admin";
    } else if (sellerId === userIdString) {
      commentRole = "seller";
    }

    // Create comment
    const newComment = await sampleRequestCommentRepository.create({
      sampleRequestId,
      userId,
      userRole: commentRole,
      comment: comment.trim(),
      attachments: attachments || [],
    });

    // Populate user details
    const populatedComment = await sampleRequestCommentRepository.findById(newComment._id);

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedComment,
    });
  } catch (error) {
    console.error("Error in addComment controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add comment",
    });
  }
};

/**
 * Get all comments for a sample request
 */
export const getComments = async (req, res) => {
  try {
    const { sampleRequestId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.user_type;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Check if sample request exists
    const sampleRequest = await sampleRequestRepository.findById(sampleRequestId, [
      {
        path: "product",
        select: "createdBy",
      },
    ]);

    if (!sampleRequest) {
      return res.status(404).json({
        success: false,
        message: "Sample request not found",
      });
    }

    // Check if user has access
    const buyerId = sampleRequest.user.toString();
    const sellerId = sampleRequest.product.createdBy.toString();
    const userIdString = userId.toString();

    const hasAccess =
      userRole === "admin" ||
      buyerId === userIdString ||
      sellerId === userIdString;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to view comments on this sample request",
      });
    }

    // Get comments
    const result = await sampleRequestCommentRepository.findBySampleRequestId(
      sampleRequestId,
      { page, limit }
    );

    res.status(200).json({
      success: true,
      data: result.comments,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getComments controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch comments",
    });
  }
};

/**
 * Get comment count for a sample request
 */
export const getCommentCount = async (req, res) => {
  try {
    const { sampleRequestId } = req.params;

    const count = await sampleRequestCommentRepository.getCommentCount(sampleRequestId);

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error in getCommentCount controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get comment count",
    });
  }
};

/**
 * Update a comment
 */
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    const userRole = req.user.user_type;

    // Validation
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    if (comment.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 2000 characters",
      });
    }

    // Get the comment
    const existingComment = await sampleRequestCommentRepository.findById(commentId);

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user is the author or admin
    const isAuthor = existingComment.userId._id.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    // Update comment
    const updatedComment = await sampleRequestCommentRepository.update(commentId, {
      comment: comment.trim(),
    });

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    console.error("Error in updateComment controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update comment",
    });
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.user_type;

    // Get the comment
    const existingComment = await sampleRequestCommentRepository.findById(commentId);

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user is the author or admin
    const isAuthor = existingComment.userId._id.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    // Soft delete the comment
    await sampleRequestCommentRepository.softDelete(commentId);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteComment controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete comment",
    });
  }
};
