import quoteRequestService from "../services/quoteRequest.service.js";

class QuoteRequestController {
  /**
   * Create new quote request
   */
  async createQuoteRequest(req, res) {
    try {
      const buyerId = req.user.id;
      const data = {
        ...req.body,
        buyerId,
      };

      const quoteRequest = await quoteRequestService.createQuoteRequest(data);

      return res.status(201).json({
        success: true,
        message: "Quote request created successfully",
        data: quoteRequest,
      });
    } catch (error) {
      console.error("Error creating quote request:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create quote request",
      });
    }
  }

  /**
   * Get seller's quote requests
   */
  async getSellerQuoteRequests(req, res) {
    try {
      const sellerId = req.user.id;
      const filters = {
        status: req.query.status,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      const result = await quoteRequestService.getSellerQuoteRequests(
        sellerId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.quoteRequests,
        pagination: result.pagination,
        statusSummary: result.statusSummary,
      });
    } catch (error) {
      console.error("Error fetching seller quote requests:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch quote requests",
      });
    }
  }

  /**
   * Get buyer's quote requests
   */
  async getBuyerQuoteRequests(req, res) {
    try {
      const buyerId = req.user.id;
      const filters = {
        status: req.query.status,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      const result = await quoteRequestService.getBuyerQuoteRequests(
        buyerId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.quoteRequests,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error fetching buyer quote requests:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch quote requests",
      });
    }
  }

  /**
   * Get single quote request by ID
   */
  async getQuoteRequestById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role || "user";

      const quoteRequest = await quoteRequestService.getQuoteRequestById(
        id,
        userId,
        userRole
      );

      return res.status(200).json({
        success: true,
        data: quoteRequest,
      });
    } catch (error) {
      console.error("Error fetching quote request:", error);
      return res.status(error.message === "Quote request not found" ? 404 : 403).json({
        success: false,
        message: error.message || "Failed to fetch quote request",
      });
    }
  }

  /**
   * Update quote request status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { status, message, updatedBy } = req.body;

      // Validate required fields
      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      // Validate status value
      const validStatuses = ["pending", "responded", "accepted", "rejected", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      // Message is required for rejected and cancelled statuses
      if ((status === "rejected" || status === "cancelled") && !message) {
        return res.status(400).json({
          success: false,
          message: "Message is required when rejecting or cancelling a request",
        });
      }

      const statusData = {
        status,
        message,
        updatedBy: updatedBy || "seller",
      };

      const quoteRequest = await quoteRequestService.updateQuoteRequestStatus(
        id,
        statusData,
        userId
      );

      return res.status(200).json({
        success: true,
        message: "Status updated successfully",
        data: quoteRequest,
      });
    } catch (error) {
      console.error("Error updating quote request status:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update status",
      });
    }
  }

  /**
   * Seller responds to quote request
   */
  async sellerRespond(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.id;
      const responseData = req.body;

      // Validate required fields
      if (!responseData.message && !responseData.quotedPrice) {
        return res.status(400).json({
          success: false,
          message: "Message or quoted price is required",
        });
      }

      const quoteRequest = await quoteRequestService.sellerRespond(
        id,
        sellerId,
        responseData
      );

      return res.status(200).json({
        success: true,
        message: "Response submitted successfully",
        data: quoteRequest,
      });
    } catch (error) {
      console.error("Error submitting seller response:", error);
      const statusCode = error.message.includes("not authorized") ? 403 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to submit response",
      });
    }
  }

  /**
   * Delete quote request
   */
  async deleteQuoteRequest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role || "user";

      await quoteRequestService.deleteQuoteRequest(id, userId, userRole);

      return res.status(200).json({
        success: true,
        message: "Quote request deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting quote request:", error);
      const statusCode = error.message.includes("not authorized") ? 403 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to delete quote request",
      });
    }
  }

  /**
   * Get quote requests by product ID (for seller)
   */
  async getQuotesByProductId(req, res) {
    try {
      const { productId } = req.params;
      const sellerId = req.user.id;

      const quoteRequests = await quoteRequestService.getQuoteRequestsByProductId(
        productId,
        sellerId
      );

      return res.status(200).json({
        success: true,
        data: quoteRequests,
      });
    } catch (error) {
      console.error("Error fetching quotes by product ID:", error);
      const statusCode = error.message.includes("not have access") ? 403 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to fetch quote requests",
      });
    }
  }
}

export default new QuoteRequestController();
