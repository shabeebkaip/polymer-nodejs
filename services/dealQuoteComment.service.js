import dealQuoteCommentRepository from "../repositories/dealQuoteComment.repository.js";
import dealQuoteRequestRepository from "../repositories/dealQuoteRequest.repository.js";
import notificationService from "./notification.service.js";
import User from "../models/user.js";

class DealQuoteCommentService {
  /**
   * Add a comment to a deal quote request
   */
  async addComment(dealQuoteRequestId, userId, userRole, commentData) {
    try {
      // Step 1: Validate deal quote request exists and user has access
      const dealQuote = await dealQuoteRequestRepository.findById(
        dealQuoteRequestId
      );

      if (!dealQuote) {
        throw new Error("Deal quote request not found");
      }

      // Check access
      const buyerId = dealQuote.buyerId._id.toString();
      const sellerId = dealQuote.sellerId._id.toString();
      const userIdString = userId.toString();

      const hasAccess =
        buyerId === userIdString ||
        sellerId === userIdString ||
        userRole === "admin";

      if (!hasAccess) {
        throw new Error("You do not have access to comment on this request");
      }

      // Step 2: Create the comment
      const comment = await dealQuoteCommentRepository.create({
        dealQuoteRequestId,
        userId,
        userRole,
        comment: commentData.comment,
        attachments: commentData.attachments || [],
      });

      // Step 3: Send notifications to other party
      try {
        await this._sendCommentNotifications(
          dealQuote,
          comment,
          userId,
          userRole
        );
      } catch (notifError) {
        console.error("Failed to send comment notifications:", notifError);
        // Don't fail the comment creation if notifications fail
      }

      // Step 4: Return populated comment
      return await dealQuoteCommentRepository.findById(comment._id);
    } catch (error) {
      console.error("Error in addComment service:", error);
      throw error;
    }
  }

  /**
   * Get all comments for a deal quote request
   */
  async getComments(dealQuoteRequestId, userId, userRole, options = {}) {
    try {
      // Validate deal quote request exists and user has access
      const dealQuote = await dealQuoteRequestRepository.findById(
        dealQuoteRequestId
      );

      if (!dealQuote) {
        throw new Error("Deal quote request not found");
      }

      // Check access
      const buyerId = dealQuote.buyerId._id.toString();
      const sellerId = dealQuote.sellerId._id.toString();
      const userIdString = userId.toString();

      const hasAccess =
        buyerId === userIdString ||
        sellerId === userIdString ||
        userRole === "admin";

      if (!hasAccess) {
        throw new Error("You do not have access to view these comments");
      }

      // Get comments with pagination
      return await dealQuoteCommentRepository.findByDealQuoteRequestId(
        dealQuoteRequestId,
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
      const comment = await dealQuoteCommentRepository.findById(commentId);

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
      return await dealQuoteCommentRepository.update(commentId, {
        comment: updateData.comment,
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
      const comment = await dealQuoteCommentRepository.findById(commentId);

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
      return await dealQuoteCommentRepository.softDelete(commentId);
    } catch (error) {
      console.error("Error in deleteComment service:", error);
      throw error;
    }
  }

  /**
   * Get comment count for a deal quote request
   */
  async getCommentCount(dealQuoteRequestId) {
    try {
      return await dealQuoteCommentRepository.getCommentCount(
        dealQuoteRequestId
      );
    } catch (error) {
      console.error("Error in getCommentCount service:", error);
      throw error;
    }
  }

  /**
   * Send notifications when a new comment is added
   */
  async _sendCommentNotifications(dealQuote, comment, commenterId, commenterRole) {
    try {
      const buyerId = dealQuote.buyerId._id.toString();
      const sellerId = dealQuote.sellerId._id.toString();
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
            type: "deal_quote_comment",
            message: `Admin added a comment: "${comment.comment.substring(0, 100)}${comment.comment.length > 100 ? "..." : ""}"`,
            redirectUrl: `/deal-quote-request/${dealQuote._id}`,
            relatedId: dealQuote._id,
          })
        );

        // Notify seller
        notifications.push(
          notificationService.createNotification({
            userId: sellerId,
            type: "deal_quote_comment",
            message: `Admin added a comment: "${comment.comment.substring(0, 100)}${comment.comment.length > 100 ? "..." : ""}"`,
            redirectUrl: `/deal-quote-request/${dealQuote._id}`,
            relatedId: dealQuote._id,
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
        type: "deal_quote_comment",
        message: `${commenterName} commented: "${comment.comment.substring(0, 100)}${comment.comment.length > 100 ? "..." : ""}"`,
        redirectUrl: `/deal-quote-request/${dealQuote._id}`,
        relatedId: dealQuote._id,
      });

      // TODO: Send email notification
      console.log(`Email notification would be sent to user ${recipientId}`);
    } catch (error) {
      console.error("Error sending comment notifications:", error);
      throw error;
    }
  }
}

export default new DealQuoteCommentService();
