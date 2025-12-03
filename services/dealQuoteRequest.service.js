import dealQuoteRequestRepository from "../repositories/dealQuoteRequest.repository.js";
import BestDeal from "../models/bestDeal.js";
import mongoose from "mongoose";

class DealQuoteRequestService {
  /**
   * Create a new deal quote request
   */
  async createDealQuoteRequest(data) {
    const { bestDealId } = data;

    // Fetch sellerId from BestDeal -> Product -> createdBy
    const bestDeal = await BestDeal.findById(bestDealId)
      .populate({ 
        path: 'productId', 
        select: 'createdBy', 
        populate: { 
          path: 'createdBy', 
          select: '_id' 
        } 
      })
      .select('productId');

    if (!bestDeal || !bestDeal.productId || !bestDeal.productId.createdBy || !bestDeal.productId.createdBy._id) {
      throw new Error('Invalid bestDealId or missing product owner (sellerId)');
    }

    const sellerId = bestDeal.productId.createdBy._id;

    // Create the request
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
      const hasAccess =
        dealQuote.buyerId._id.toString() === userId ||
        dealQuote.sellerId._id.toString() === userId;

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
    const { status, message, updatedBy = "seller" } = statusData;

    const dealQuote = await dealQuoteRequestRepository.addStatusMessage(id, {
      status,
      message,
      date: new Date(),
      updatedBy,
    });

    if (!dealQuote) {
      throw new Error("Deal quote request not found");
    }

    return dealQuote;
  }

  /**
   * Seller responds to deal quote
   */
  async sellerRespond(id, sellerId, responseData) {
    const dealQuote = await dealQuoteRequestRepository.findById(id);

    if (!dealQuote) {
      throw new Error("Deal quote request not found");
    }

    if (dealQuote.sellerId.toString() !== sellerId) {
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

    return await dealQuoteRequestRepository.update(id, updateData);
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
}

export default new DealQuoteRequestService();
