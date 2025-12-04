import dealQuoteRequestRepository from "../repositories/dealQuoteRequest.repository.js";
import BestDeal from "../models/bestDeal.js";
import User from "../models/user.js";
import notificationService from "./notification.service.js";
import mongoose from "mongoose";

class DealQuoteRequestService {
  /**
   * Create a new deal quote request
   */
  async createDealQuoteRequest(data) {
    const { bestDealId, buyerId } = data;

    // Step 1: Validate and fetch all required data BEFORE creating the quote
    // Fetch deal and seller details
    const bestDeal = await BestDeal.findById(bestDealId)
      .populate({ 
        path: 'productId', 
        select: 'productName createdBy', 
        populate: { 
          path: 'createdBy', 
          select: '_id firstName lastName email company' 
        } 
      })
      .select('title description dealPrice productId');

    if (!bestDeal || !bestDeal.productId || !bestDeal.productId.createdBy || !bestDeal.productId.createdBy._id) {
      throw new Error('Invalid bestDealId or missing product owner (sellerId)');
    }

    const sellerId = bestDeal.productId.createdBy._id;

    // Fetch buyer details (validate buyer exists)
    const buyer = await User.findById(buyerId).select('firstName lastName email company');
    if (!buyer) {
      throw new Error('Invalid buyerId - buyer not found');
    }

    // Step 2: Only NOW create the request (after all validations pass)
    const dealQuote = await dealQuoteRequestRepository.create({
      ...data,
      sellerId,
      status: [
        {
          status: "pending",
          message: "Deal quote request submitted",
          date: new Date(),
          updatedBy: "buyer",
        },
      ],
    });

    // Step 3: Send notifications (non-critical - can fail without rolling back)
    try {
      await notificationService.notifySellerNewRequest({
        seller: bestDeal.productId.createdBy,
        buyer,
        deal: bestDeal,
        request: dealQuote,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't fail the request creation if notification fails
    }

    return dealQuote;
  }

  /**
   * Get deal quotes for seller with filters and pagination
   */
  async getSellerDealQuotes(sellerId, filters) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { sellerId: new mongoose.Types.ObjectId(sellerId) };

    if (status) {
      filter['status.status'] = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [{ message: { $regex: search, $options: "i" } }];
    }

    // Populate config
    const populate = [
      {
        path: "buyerId",
        select:
          "firstName lastName email phone company address city state country",
      },
      {
        path: "bestDealId",
        select: "title description dealPrice productId",
        populate: {
          path: "productId",
          select:
            "productName chemicalName tradeName productImages countryOfOrigin color density mfi",
        },
      },
    ];

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // Fetch data
    const [dealQuotes, total, statusSummary] = await Promise.all([
      dealQuoteRequestRepository.findWithFilters({
        filter,
        sort,
        skip,
        limit: parseInt(limit),
        populate,
      }),
      dealQuoteRequestRepository.count(filter),
      dealQuoteRequestRepository.getStatusSummary(
        new mongoose.Types.ObjectId(sellerId)
      ),
    ]);

    return {
      dealQuotes,
      total,
      statusSummary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  /**
   * Get deal quotes for buyer
   */
  async getBuyerDealQuotes(buyerId, filters) {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { buyerId: new mongoose.Types.ObjectId(buyerId) };
    if (status) filter['status.status'] = status;

    const populate = [
      {
        path: "sellerId",
        select: "firstName lastName company email phone",
      },
      {
        path: "bestDealId",
        select: "title description dealPrice productId",
        populate: {
          path: "productId",
          select: "productName chemicalName productImages",
        },
      },
    ];

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [dealQuotes, total] = await Promise.all([
      dealQuoteRequestRepository.findWithFilters({
        filter,
        sort,
        skip,
        limit: parseInt(limit),
        populate,
      }),
      dealQuoteRequestRepository.count(filter),
    ]);

    return {
      dealQuotes,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  /**
   * Get single deal quote by ID
   */
  async getDealQuoteById(id, userId, userRole) {
    const populate = [
      {
        path: "buyerId",
        select:
          "firstName lastName email phone company address city state country pincode",
      },
      {
        path: "sellerId",
        select: "firstName lastName email phone company",
      },
      {
        path: "bestDealId",
        select: "title description dealPrice productId",
        populate: {
          path: "productId",
          select:
            "productName chemicalName tradeName description productImages countryOfOrigin color density mfi manufacturingMethod",
        },
      },
    ];

    const dealQuote = await dealQuoteRequestRepository.findById(id, populate);

    if (!dealQuote) {
      throw new Error("Deal quote request not found");
    }

    // Check access rights
    if (userRole !== "admin") {
      const userIdString = userId.toString();
      const buyerIdString = dealQuote.buyerId._id.toString();
      const sellerIdString = dealQuote.sellerId._id.toString();
      
      console.log('Access check:', {
        userId: userIdString,
        buyerId: buyerIdString,
        sellerId: sellerIdString,
        userRole
      });
      
      const hasAccess =
        buyerIdString === userIdString ||
        sellerIdString === userIdString;

      if (!hasAccess) {
        throw new Error("You do not have access to this deal quote request");
      }
    }

    return dealQuote;
  }

  /**
   * Update deal quote status
   */
  async updateDealQuoteStatus(id, statusData, userId) {
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
        path: 'bestDealId', 
        select: 'title description dealPrice productId',
        populate: {
          path: 'productId',
          select: 'productName'
        }
      }
    ];

    const currentQuote = await dealQuoteRequestRepository.findById(id, populate);
    if (!currentQuote) {
      throw new Error("Deal quote request not found");
    }

    const oldStatus = currentQuote.currentStatus;

    // Add new status
    const dealQuote = await dealQuoteRequestRepository.addStatusMessage(id, {
      status,
      message,
      date: new Date(),
      updatedBy,
    });

    // Send notification to buyer if status was updated by seller
    if (updatedBy === "seller" && status !== oldStatus) {
      try {
        await notificationService.notifyBuyerStatusUpdate({
          buyer: currentQuote.buyerId,
          seller: currentQuote.sellerId,
          deal: currentQuote.bestDealId,
          request: dealQuote,
          oldStatus,
          newStatus: status,
          message,
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
        // Don't fail the status update if notification fails
      }
    }

    return dealQuote;
  }

  /**
   * Seller responds to deal quote
   */
  async sellerRespond(id, sellerId, responseData) {
    const populate = [
      { path: 'buyerId', select: 'firstName lastName email company' },
      { path: 'sellerId', select: 'firstName lastName email company' },
      { 
        path: 'bestDealId', 
        select: 'title description dealPrice productId',
        populate: {
          path: 'productId',
          select: 'productName createdBy'
        }
      }
    ];

    const dealQuote = await dealQuoteRequestRepository.findById(id, populate);

    if (!dealQuote) {
      throw new Error("Deal quote request not found");
    }

    // Check authorization: seller must be the one who created the deal
    const dealCreatorId = dealQuote.bestDealId?.productId?.createdBy?.toString();
    if (!dealCreatorId || dealCreatorId !== sellerId.toString()) {
      throw new Error("You are not authorized to respond to this request");
    }

    // Build seller response object
    const sellerResponse = {
      message: responseData.message,
      quotedPrice: responseData.quotedPrice,
      quotedQuantity: responseData.quotedQuantity,
      estimatedDelivery: responseData.estimatedDelivery,
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
      await this.updateDealQuoteStatus(
        id,
        {
          status: responseData.status,
          message: responseData.message || "Seller responded to request",
          updatedBy: "seller",
        },
        sellerId
      );
    }

    const updatedQuote = await dealQuoteRequestRepository.update(id, updateData);

    // Send notification to buyer
    try {
      await notificationService.notifyBuyerQuotationReceived({
        buyer: dealQuote.buyerId,
        seller: dealQuote.sellerId,
        deal: dealQuote.bestDealId,
        request: updatedQuote,
        quotation: sellerResponse,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't fail the response if notification fails
    }

    return updatedQuote;
  }

  /**
   * Delete deal quote request
   */
  async deleteDealQuoteRequest(id, userId, userRole) {
    const dealQuote = await dealQuoteRequestRepository.findById(id);

    if (!dealQuote) {
      throw new Error("Deal quote request not found");
    }

    // Only buyer or admin can delete
    if (
      userRole !== "admin" &&
      dealQuote.buyerId.toString() !== userId
    ) {
      throw new Error("You are not authorized to delete this request");
    }

    return await dealQuoteRequestRepository.delete(id);
  }

  /**
   * Get deal quote requests by deal ID for seller
   */
  async getDealQuotesByDealId(bestDealId, sellerId) {
    try {
      // Verify the deal belongs to this seller
      const bestDeal = await BestDeal.findById(bestDealId)
        .populate({ 
          path: 'productId', 
          select: 'createdBy'
        });

      if (!bestDeal) {
        throw new Error('Deal not found');
      }

      // Check if seller owns this deal's product
      const productSellerId = bestDeal.productId?.createdBy?.toString();
      if (productSellerId !== sellerId.toString()) {
        throw new Error('You do not have access to this deal\'s requests');
      }

      // Fetch all quote requests for this deal
      const dealQuotes = await dealQuoteRequestRepository.findByBestDealId(
        bestDealId,
        [
          {
            path: 'buyerId',
            select: 'firstName lastName email phone company city state country address pincode'
          },
          {
            path: 'bestDealId',
            select: 'title description dealPrice productId',
            populate: {
              path: 'productId',
              select: 'productName productImages chemicalName tradeName'
            }
          }
        ]
      );

      return dealQuotes;
    } catch (error) {
      console.error('Error in getDealQuotesByDealId service:', error);
      throw error;
    }
  }
}

export default new DealQuoteRequestService();
