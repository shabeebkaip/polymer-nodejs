import dealQuoteCommentService from "../services/dealQuoteComment.service.js";

/**
 * Add a comment to a deal quote request
 */
export const addComment = async (req, res) => {
  try {
    const { dealQuoteRequestId } = req.params;
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

    const newComment = await dealQuoteCommentService.addComment(
      dealQuoteRequestId,
      userId,
      userRole,
      { comment, attachments }
    );

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: newComment,
    });
  } catch (error) {
    console.error("Error in addComment controller:", error);
    res.status(error.message.includes("not found") ? 404 : 403).json({
      success: false,
      message: error.message || "Failed to add comment",
    });
  }
};

/**
 * Get all comments for a deal quote request
 */
export const getComments = async (req, res) => {
  try {
    const { dealQuoteRequestId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.user_type;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await dealQuoteCommentService.getComments(
      dealQuoteRequestId,
      userId,
      userRole,
      { page, limit }
    );

    res.status(200).json({
      success: true,
      data: result.comments,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getComments controller:", error);
    res.status(error.message.includes("not found") ? 404 : 403).json({
      success: false,
      message: error.message || "Failed to fetch comments",
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

    const updatedComment = await dealQuoteCommentService.updateComment(
      commentId,
      userId,
      userRole,
      { comment }
    );

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    console.error("Error in updateComment controller:", error);
    res.status(error.message.includes("not found") ? 404 : 403).json({
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

    await dealQuoteCommentService.deleteComment(commentId, userId, userRole);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteComment controller:", error);
    res.status(error.message.includes("not found") ? 404 : 403).json({
      success: false,
      message: error.message || "Failed to delete comment",
    });
  }
};

/**
 * Get comment count for a deal quote request
 */
export const getCommentCount = async (req, res) => {
  try {
    const { dealQuoteRequestId } = req.params;

    const count = await dealQuoteCommentService.getCommentCount(
      dealQuoteRequestId
    );

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Error in getCommentCount controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get comment count",
    });
  }
};
