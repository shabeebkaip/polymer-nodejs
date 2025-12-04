import quoteCommentRepository from "../repositories/quoteComment.repository.js";
import quoteRequestRepository from "../repositories/quoteRequest.repository.js";
import notificationService from "./notification.service.js";
import User from "../models/user.js";

class QuoteCommentService {
  /**
   * Add a comment to a quote request
   */
  async addComment(quoteRequestId, userId, userRole, commentData) {
    try {
      // Step 1: Validate quote request exists and user has access
      const quoteRequest = await quoteRequestRepository.findById(
        quoteRequestId
      );

      if (!quoteRequest) {
        throw new Error("Quote request not found");
      }

      // Check access
      const buyerId = quoteRequest.buyerId._id.toString();
      const sellerId = quoteRequest.sellerId._id.toString();
      const userIdString = userId.toString();

      const hasAccess =
        buyerId === userIdString ||
        sellerId === userIdString ||
        userRole === "admin";

      if (!hasAccess) {
        throw new Error("You do not have access to comment on this request");
      }

      // Step 2: Create the comment
      const comment = await quoteCommentRepository.create({
        quoteRequestId,
        userId,
        userRole,
        comment: commentData.comment,
        attachments: commentData.attachments || [],
      });

      // Step 3: Send notifications to other party
      try {
        await this._sendCommentNotifications(
          quoteRequest,
          comment,
          userId,
          userRole
        );
      } catch (notifError) {
        console.error("Failed to send comment notifications:", notifError);
        // Don't fail the comment creation if notifications fail
      }

      // Step 4: Return populated comment
      return await quoteCommentRepository.findById(comment._id);
    } catch (error) {
      console.error("Error in addComment service:", error);
      throw error;
    }
  }

  /**
   * Get all comments for a quote request
   */
  async getComments(quoteRequestId, userId, userRole, options = {}) {
    try {
      // Validate quote request exists and user has access
      const quoteRequest = await quoteRequestRepository.findById(
        quoteRequestId
      );

      if (!quoteRequest) {
        throw new Error("Quote request not found");
      }

      // Check access
      const buyerId = quoteRequest.buyerId._id.toString();
      const sellerId = quoteRequest.sellerId._id.toString();
      const userIdString = userId.toString();

      const hasAccess =
        buyerId === userIdString ||
        sellerId === userIdString ||
        userRole === "admin";

      if (!hasAccess) {
        throw new Error("You do not have access to view these comments");
      }

      // Get comments with pagination
      return await quoteCommentRepository.findByQuoteRequestId(
        quoteRequestId,
        options
      );
    } catch (error) {
      console.error("Error in getComments service:", error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  async updateComment(commentId, userId, userRole, updateData) {
    try {
      // Get the comment
      const comment = await quoteCommentRepository.findById(commentId);

      if (!comment) {
        throw new Error("Comment not found");
      }

      if (comment.isDeleted) {
        throw new Error("Cannot update a deleted comment");
      }

      // Check ownership (only the author or admin can edit)
      if (comment.userId._id.toString() !== userId.toString() && userRole !== "admin") {
        throw new Error("You can only edit your own comments");
      }

      // Update the comment
      return await quoteCommentRepository.update(commentId, {
        comment: updateData.comment,
        attachments: updateData.attachments,
        isEdited: true,
        editedAt: new Date(),
      });
    } catch (error) {
      console.error("Error in updateComment service:", error);
      throw error;
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId, userId, userRole) {
    try {
      // Get the comment
      const comment = await quoteCommentRepository.findById(commentId);

      if (!comment) {
        throw new Error("Comment not found");
      }

      if (comment.isDeleted) {
        throw new Error("Comment is already deleted");
      }

      // Check ownership (only the author or admin can delete)
      if (comment.userId._id.toString() !== userId.toString() && userRole !== "admin") {
        throw new Error("You can only delete your own comments");
      }

      // Soft delete the comment
      return await quoteCommentRepository.softDelete(commentId);
    } catch (error) {
      console.error("Error in deleteComment service:", error);
      throw error;
    }
  }

  /**
   * Get comment count for a quote request
   */
  async getCommentCount(quoteRequestId) {
    try {
      return await quoteCommentRepository.countByQuoteRequestId(
        quoteRequestId,
        false
      );
    } catch (error) {
      console.error("Error in getCommentCount service:", error);
      throw error;
    }
  }

  /**
   * Send notifications when a new comment is added
   */
  async _sendCommentNotifications(quoteRequest, comment, commenterId, commenterRole) {
    try {
      const buyerId = quoteRequest.buyerId._id.toString();
      const sellerId = quoteRequest.sellerId._id.toString();
      const commenterId_str = commenterId.toString();

      // Get commenter details
      const commenter = await User.findById(commenterId);
      const commenterName = commenter?.name || "Someone";

      // Determine who to notify (the other party)
      let recipientId;
      let recipientRole;

      if (commenterRole === "buyer") {
        recipientId = sellerId;
        recipientRole = "seller";
      } else if (commenterRole === "seller") {
        recipientId = buyerId;
        recipientRole = "buyer";
      } else if (commenterRole === "admin") {
        // Admin comments notify both parties
        const notifications = [];

        // Notify buyer
        notifications.push(
          notificationService.createNotification({
            userId: buyerId,
            type: "quote_comment",
            message: `Admin added a comment: "${comment.comment.substring(0, 100)}${comment.comment.length > 100 ? "..." : ""}"`,
            redirectUrl: `/quote-request/${quoteRequest._id}`,
            relatedId: quoteRequest._id,
          })
        );

        // Notify seller
        notifications.push(
          notificationService.createNotification({
            userId: sellerId,
            type: "quote_comment",
            message: `Admin added a comment: "${comment.comment.substring(0, 100)}${comment.comment.length > 100 ? "..." : ""}"`,
            redirectUrl: `/quote-request/${quoteRequest._id}`,
            relatedId: quoteRequest._id,
          })
        );

        await Promise.all(notifications);
        return;
      }

      // Don't notify yourself
      if (recipientId === commenterId_str) {
        return;
      }

      // Create notification for the other party
      await notificationService.createNotification({
        userId: recipientId,
        type: "quote_comment",
        message: `${commenterName} commented: "${comment.comment.substring(0, 100)}${comment.comment.length > 100 ? "..." : ""}"`,
        redirectUrl: `/quote-request/${quoteRequest._id}`,
        relatedId: quoteRequest._id,
      });

      // TODO: Send email notification
      console.log(`Email notification would be sent to user ${recipientId}`);
    } catch (error) {
      console.error("Error sending comment notifications:", error);
      throw error;
    }
  }
}

export default new QuoteCommentService();
