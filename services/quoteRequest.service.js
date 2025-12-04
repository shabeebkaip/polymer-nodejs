import quoteRequestRepository from "../repositories/quoteRequest.repository.js";
import Product from "../models/product.js";
import User from "../models/user.js";
import notificationService from "./notification.service.js";
import mongoose from "mongoose";

class QuoteRequestService {
  /**
   * Create a new quote request
   */
  async createQuoteRequest(data) {
    const { productId, buyerId } = data;

    // Step 1: Validate and fetch all required data BEFORE creating the quote
    // Fetch product and seller details
    const product = await Product.findById(productId)
      .populate({ 
        path: 'createdBy', 
        select: '_id firstName lastName email company' 
      })
      .select('productName createdBy');

    if (!product || !product.createdBy || !product.createdBy._id) {
      throw new Error('Invalid productId or missing product owner (sellerId)');
    }

    const sellerId = product.createdBy._id;

    // Fetch buyer details (validate buyer exists)
    const buyer = await User.findById(buyerId).select('firstName lastName email company');
    if (!buyer) {
      throw new Error('Invalid buyerId - buyer not found');
    }

    // Step 2: Only NOW create the request (after all validations pass)
    const quoteRequest = await quoteRequestRepository.create({
      ...data,
      sellerId,
      status: [
        {
          status: "pending",
          message: "Quote request submitted",
          date: new Date(),
          updatedBy: "buyer",
        },
      ],
    });

    // Step 3: Send notifications (non-critical, don't fail if this errors)
    try {
      await notificationService.createNotification({
        userId: sellerId,
        type: "quote_request",
        message: `New quote request from ${buyer.firstName} ${buyer.lastName} for ${product.productName}`,
        redirectUrl: `/quote-request/${quoteRequest._id}`,
        relatedId: quoteRequest._id,
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
      // Don't fail the quote creation if notification fails
    }

    return quoteRequest;
  }

  /**
   * Get quote requests for seller
   */
  async getSellerQuoteRequests(sellerId, filters = {}) {
    const { status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const filter = { sellerId: new mongoose.Types.ObjectId(sellerId) };
    
    if (status) {
      filter['status.status'] = status;
    }

    const populate = [
      {
        path: 'buyerId',
        select: 'firstName lastName email phone company city state country address pincode'
      },
      {
        path: 'productId',
        select: 'productName productImages chemicalName tradeName description countryOfOrigin'
      },
      {
        path: 'gradeId',
        select: 'name'
      },
      {
        path: 'incotermId',
        select: 'name'
      },
      {
        path: 'packagingTypeId',
        select: 'name'
      }
    ];

    const [quoteRequests, total] = await Promise.all([
      quoteRequestRepository.findWithFilters({ filter, populate, skip, limit, sort: { createdAt: -1 } }),
      quoteRequestRepository.count(filter),
    ]);

    const statusSummary = await quoteRequestRepository.getStatusSummary(sellerId);

    return {
      quoteRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusSummary,
    };
  }

  /**
   * Get quote requests for buyer
   */
  async getBuyerQuoteRequests(buyerId, filters = {}) {
    const { status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const filter = { buyerId: new mongoose.Types.ObjectId(buyerId) };
    
    if (status) {
      filter['status.status'] = status;
    }

    const populate = [
      {
        path: 'sellerId',
        select: 'firstName lastName email phone company'
      },
      {
        path: 'productId',
        select: 'productName productImages chemicalName tradeName description countryOfOrigin'
      },
      {
        path: 'gradeId',
        select: 'name'
      },
      {
        path: 'incotermId',
        select: 'name'
      },
      {
        path: 'packagingTypeId',
        select: 'name'
      }
    ];

    const [quoteRequests, total] = await Promise.all([
      quoteRequestRepository.findWithFilters({ filter, populate, skip, limit, sort: { createdAt: -1 } }),
      quoteRequestRepository.count(filter),
    ]);

    return {
      quoteRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single quote request by ID
   */
  async getQuoteRequestById(id, userId, userRole = "user") {
    const populate = [
      {
        path: 'buyerId',
        select: 'firstName lastName email phone company address city state country pincode'
      },
      {
        path: 'sellerId',
        select: 'firstName lastName email phone company'
      },
      {
        path: 'productId',
        select: 'productName productImages chemicalName tradeName description countryOfOrigin color density mfi manufacturingMethod'
      },
      {
        path: 'gradeId',
        select: 'name'
      },
      {
        path: 'incotermId',
        select: 'name'
      },
      {
        path: 'packagingTypeId',
        select: 'name'
      }
    ];

    const quoteRequest = await quoteRequestRepository.findById(id, populate);

    if (!quoteRequest) {
      throw new Error("Quote request not found");
    }

    // Check access
    if (userRole !== "admin") {
      const buyerId = quoteRequest.buyerId._id.toString();
      const sellerId = quoteRequest.sellerId._id.toString();
      const userIdString = userId.toString();

      const hasAccess = buyerId === userIdString || sellerId === userIdString;

      if (!hasAccess) {
        throw new Error("You do not have access to this quote request");
      }
    }

    return quoteRequest;
  }

  /**
   * Update quote request status
   */
  async updateQuoteRequestStatus(id, statusData, userId) {
    const { status, updatedBy = "seller" } = statusData;
    let { message } = statusData;

    // Provide default message if not provided
    if (!message) {
      const defaultMessages = {
        pending: "Status updated to pending",
        responded: "Quotation has been provided",
        accepted: "Request has been accepted",
        rejected: "Request has been rejected",
        cancelled: "Request has been cancelled"
      };
      message = defaultMessages[status] || `Status updated to ${status}`;
    }

    // Get current status before update
    const populate = [
      { path: 'buyerId', select: 'firstName lastName email company' },
      { path: 'sellerId', select: 'firstName lastName email company' },
      { 
        path: 'productId', 
        select: 'productName'
      }
    ];

    const currentQuote = await quoteRequestRepository.findById(id, populate);
    if (!currentQuote) {
      throw new Error("Quote request not found");
    }

    const oldStatus = currentQuote.currentStatus;

    // Add new status
    const quoteRequest = await quoteRequestRepository.addStatusMessage(id, {
      status,
      message,
      date: new Date(),
      updatedBy,
    });

    // Send notification to buyer if status was updated by seller
    if (updatedBy === "seller" && status !== oldStatus) {
      try {
        await notificationService.createNotification({
          userId: currentQuote.buyerId._id,
          type: "quote_status",
          message: `Quote request status updated to ${status}: ${message}`,
          redirectUrl: `/quote-request/${quoteRequest._id}`,
          relatedId: quoteRequest._id,
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
        // Don't fail the status update if notification fails
      }
    }

    return quoteRequest;
  }

  /**
   * Seller responds to quote request
   */
  async sellerRespond(id, sellerId, responseData) {
    const populate = [
      { path: 'buyerId', select: 'firstName lastName email company' },
      { path: 'sellerId', select: 'firstName lastName email company' },
      { 
        path: 'productId', 
        select: 'productName createdBy'
      }
    ];

    const quoteRequest = await quoteRequestRepository.findById(id, populate);

    if (!quoteRequest) {
      throw new Error("Quote request not found");
    }

    // Check authorization: seller must be the one who created the product
    const productOwnerId = quoteRequest.productId?.createdBy?.toString();
    if (!productOwnerId || productOwnerId !== sellerId.toString()) {
      throw new Error("You are not authorized to respond to this request");
    }

    // Build seller response object
    const sellerResponse = {
      message: responseData.message,
      quotedPrice: responseData.quotedPrice,
      quotedQuantity: responseData.quotedQuantity,
      estimatedDelivery: responseData.estimatedDelivery,
      leadTime: responseData.leadTime,
      terms: responseData.terms,
      respondedAt: new Date(),
    };

    // Add quotation document if provided
    if (responseData.quotationDocument) {
      sellerResponse.quotationDocument = {
        ...responseData.quotationDocument,
        uploadedAt: new Date(),
      };
    }

    const updateData = {
      sellerResponse,
    };

    // Add status message
    if (responseData.status) {
      await this.updateQuoteRequestStatus(
        id,
        {
          status: responseData.status,
          message: responseData.message || "Seller responded to request",
          updatedBy: "seller",
        },
        sellerId
      );
    } else {
      // Auto-update status to "responded" if not specified
      await this.updateQuoteRequestStatus(
        id,
        {
          status: "responded",
          message: "Seller provided quotation",
          updatedBy: "seller",
        },
        sellerId
      );
    }

    const updatedQuote = await quoteRequestRepository.update(id, updateData);

    // Send notification to buyer
    try {
      await notificationService.createNotification({
        userId: quoteRequest.buyerId._id,
        type: "quote_response",
        message: `${quoteRequest.sellerId.firstName} ${quoteRequest.sellerId.lastName} responded to your quote request`,
        redirectUrl: `/quote-request/${updatedQuote._id}`,
        relatedId: updatedQuote._id,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't fail the response if notification fails
    }

    return updatedQuote;
  }

  /**
   * Delete quote request
   */
  async deleteQuoteRequest(id, userId, userRole) {
    const quoteRequest = await quoteRequestRepository.findById(id);

    if (!quoteRequest) {
      throw new Error("Quote request not found");
    }

    // Only buyer or admin can delete
    if (
      userRole !== "admin" &&
      quoteRequest.buyerId.toString() !== userId
    ) {
      throw new Error("You are not authorized to delete this request");
    }

    return await quoteRequestRepository.delete(id);
  }

  /**
   * Get quote requests by product ID for seller
   */
  async getQuoteRequestsByProductId(productId, sellerId) {
    try {
      // Verify the product belongs to this seller
      const product = await Product.findById(productId)
        .populate({ 
          path: 'createdBy', 
          select: '_id'
        });

      if (!product) {
        throw new Error('Product not found');
      }

      // Check if seller owns this product
      const productSellerId = product.createdBy?._id?.toString();
      if (productSellerId !== sellerId.toString()) {
        throw new Error('You do not have access to this product\'s requests');
      }

      // Fetch all quote requests for this product
      const quoteRequests = await quoteRequestRepository.findByProductId(
        productId,
        [
          {
            path: 'buyerId',
            select: 'firstName lastName email phone company city state country address pincode'
          },
          {
            path: 'productId',
            select: 'productName productImages chemicalName tradeName'
          }
        ]
      );

      return quoteRequests;
    } catch (error) {
      console.error('Error in getQuoteRequestsByProductId service:', error);
      throw error;
    }
  }
}

export default new QuoteRequestService();
