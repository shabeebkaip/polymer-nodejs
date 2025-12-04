import quoteCommentService from "../services/quoteComment.service.js";

class QuoteCommentController {
  /**
   * Create a new comment
   */
  async createComment(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role || "buyer";
      const { quoteRequestId, comment, attachments } = req.body;

      if (!quoteRequestId || !comment) {
        return res.status(400).json({
          success: false,
          message: "Quote request ID and comment are required",
        });
      }

      const newComment = await quoteCommentService.addComment(
        quoteRequestId,
        userId,
        userRole,
        {
          comment,
          attachments,
        }
      );

      return res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data: newComment,
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      const statusCode = error.message.includes("not authorized") ? 403 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to create comment",
      });
    }
  }

  /**
   * Get comments for a quote request
   */
  async getComments(req, res) {
    try {
      const { quoteRequestId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role || "buyer";

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        includeDeleted: req.query.includeDeleted === "true",
      };

      const result = await quoteCommentService.getComments(
        quoteRequestId,
        userId,
        userRole,
        options
      );

      return res.status(200).json({
        success: true,
        data: result.comments,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
      const statusCode = error.message === "Quote request not found" ? 404 : 403;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to fetch comments",
      });
    }
  }

  /**
   * Update a comment
   */
  async updateComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role || "user";
      const { comment, attachments } = req.body;

      if (!comment) {
        return res.status(400).json({
          success: false,
          message: "Comment text is required",
        });
      }

      const updatedComment = await quoteCommentService.updateComment(
        commentId,
        userId,
        userRole,
        { comment, attachments }
      );

      return res.status(200).json({
        success: true,
        message: "Comment updated successfully",
        data: updatedComment,
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      const statusCode = error.message.includes("not authorized") ? 403 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to update comment",
      });
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role || "user";

      await quoteCommentService.deleteComment(commentId, userId, userRole);

      return res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      const statusCode = error.message.includes("not authorized") ? 403 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to delete comment",
      });
    }
  }
}

export default new QuoteCommentController();
