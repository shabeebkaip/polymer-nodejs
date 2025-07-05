import express from "express";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";
import QuoteRequestHelper from "../../../utils/quoteRequestHelper.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const unifiedQuoteRoutes = express.Router();

// Get all quote requests (both product and deal quotes)
unifiedQuoteRoutes.get("/", authenticateUser, async (req, res) => {
  try {
    const { 
      type, 
      status, 
      priority, 
      page = 1, 
      limit = 10,
      buyerId,
      search 
    } = req.query;
    
    // Build filters
    let filters = {};
    
    // Filter by request type
    if (type && type !== 'all') {
      filters.requestType = type;
    }
    
    // Filter by status
    if (status && status !== 'all') {
      filters.status = status;
    }
    
    // Filter by buyer (for admin/seller view)
    if (buyerId) {
      filters.buyerId = buyerId;
    }
    
    // Filter by current user (for buyer view)
    if (req.user.userType === 'buyer') {
      filters.buyerId = req.user.id;
    }
    
    // Search functionality
    if (search) {
      filters.$or = [
        { message: { $regex: search, $options: 'i' } },
        { 'statusMessage.message': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get requests with proper population
    const requests = await QuoteRequestHelper.getAllQuoteRequests(filters);
    
    // Apply priority filter (post-query since it's computed)
    let filteredRequests = requests;
    if (priority && priority !== 'all') {
      filteredRequests = requests.filter(req => 
        req.unified.priorityLevel === priority
      );
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    const paginatedRequests = filteredRequests.slice(skip, skip + parseInt(limit));
    
    // Summary statistics
    const summary = {
      total: filteredRequests.length,
      productQuotes: filteredRequests.filter(r => r.requestType === 'product_quote').length,
      dealQuotes: filteredRequests.filter(r => r.requestType === 'deal_quote').length,
      byStatus: {
        pending: filteredRequests.filter(r => r.status === 'pending').length,
        responded: filteredRequests.filter(r => r.status === 'responded').length,
        accepted: filteredRequests.filter(r => r.status === 'accepted').length,
        completed: filteredRequests.filter(r => r.status === 'completed').length,
      },
      byPriority: {
        urgent: filteredRequests.filter(r => r.unified.priorityLevel === 'urgent').length,
        high: filteredRequests.filter(r => r.unified.priorityLevel === 'high').length,
        medium: filteredRequests.filter(r => r.unified.priorityLevel === 'medium').length,
        normal: filteredRequests.filter(r => r.unified.priorityLevel === 'normal').length,
      }
    };
    
    res.status(200).json({
      success: true,
      message: "Quote requests retrieved successfully",
      data: paginatedRequests,
      meta: {
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredRequests.length,
          totalPages: Math.ceil(filteredRequests.length / limit)
        },
        filters: { type, status, priority, search },
        summary
      }
    });
    
  } catch (error) {
    console.error("Error fetching unified quote requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quote requests",
      error: {
        code: "FETCH_ERROR",
        details: error.message
      }
    });
  }
});

// Get single quote request by ID
unifiedQuoteRoutes.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await UnifiedQuoteRequest.findById(id)
      .populate('buyerId', 'firstName lastName email company phone address city country')
      .populate('product', 'productName chemicalName tradeName productImages price stock')
      .populate('bestDealId', 'title description dealPrice originalPrice validUntil')
      .populate('grade', 'name')
      .populate('incoterm', 'name')
      .populate('packagingType', 'name');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Quote request not found"
      });
    }
    
    // Authorization check
    const isOwner = request.buyerId._id.toString() === req.user.id;
    const isAdmin = req.user.userType === 'superAdmin';
    const isSeller = req.user.userType === 'seller';
    
    if (!isOwner && !isAdmin && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this quote request"
      });
    }
    
    const formattedRequest = QuoteRequestHelper.formatUnifiedResponse(request);
    
    res.status(200).json({
      success: true,
      message: "Quote request details retrieved successfully",
      data: formattedRequest
    });
    
  } catch (error) {
    console.error("Error fetching quote request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quote request",
      error: {
        code: "FETCH_ERROR",
        details: error.message
      }
    });
  }
});

// Create new quote request (unified endpoint)
unifiedQuoteRoutes.post("/", authenticateUser, async (req, res) => {
  try {
    const { requestType, ...requestData } = req.body;
    
    let unifiedData;
    
    if (requestType === 'product_quote') {
      unifiedData = QuoteRequestHelper.createProductQuote({
        ...requestData,
        buyerId: req.user.id
      });
    } else if (requestType === 'deal_quote') {
      unifiedData = QuoteRequestHelper.createDealQuote({
        ...requestData,
        buyerId: req.user.id
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid request type. Must be 'product_quote' or 'deal_quote'"
      });
    }
    
    const quoteRequest = new UnifiedQuoteRequest(unifiedData);
    await quoteRequest.save();
    
    // Populate for response
    await quoteRequest.populate([
      { path: 'buyerId', select: 'firstName lastName email company' },
      { path: 'product', select: 'productName chemicalName tradeName' },
      { path: 'bestDealId', select: 'title description dealPrice' }
    ]);
    
    const formattedResponse = QuoteRequestHelper.formatUnifiedResponse(quoteRequest);
    
    res.status(201).json({
      success: true,
      message: `${requestType === 'product_quote' ? 'Product' : 'Deal'} quote request created successfully`,
      data: formattedResponse
    });
    
  } catch (error) {
    console.error("Error creating quote request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create quote request",
      error: {
        code: "CREATE_ERROR",
        details: error.message
      }
    });
  }
});

// Update quote request status
unifiedQuoteRoutes.patch("/:id/status", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message, updatedBy = "seller" } = req.body;
    
    const request = await UnifiedQuoteRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Quote request not found"
      });
    }
    
    // Authorization check
    const isOwner = request.buyerId.toString() === req.user.id;
    const isAdmin = req.user.userType === 'superAdmin';
    const isSeller = req.user.userType === 'seller';
    
    if (!isOwner && !isAdmin && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this quote request"
      });
    }
    
    // Add status message to timeline
    const statusUpdate = {
      status,
      message: message || `Status updated to ${status}`,
      date: new Date(),
      updatedBy: isAdmin ? 'admin' : (isOwner ? 'buyer' : 'seller')
    };
    
    request.status = status;
    request.statusMessage.push(statusUpdate);
    
    await request.save();
    
    res.status(200).json({
      success: true,
      message: "Quote request status updated successfully",
      data: {
        id: request._id,
        status: request.status,
        statusUpdate
      }
    });
    
  } catch (error) {
    console.error("Error updating quote request status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update quote request status",
      error: {
        code: "UPDATE_ERROR",
        details: error.message
      }
    });
  }
});

// Get summary/dashboard data
unifiedQuoteRoutes.get("/dashboard/summary", authenticateUser, async (req, res) => {
  try {
    let filters = {};
    
    // Filter by user role
    if (req.user.userType === 'buyer') {
      filters.buyerId = req.user.id;
    }
    
    const requests = await QuoteRequestHelper.getAllQuoteRequests(filters, false);
    
    const summary = {
      totalRequests: requests.length,
      recentRequests: requests.slice(0, 5),
      typeBreakdown: {
        productQuotes: requests.filter(r => r.requestType === 'product_quote').length,
        dealQuotes: requests.filter(r => r.requestType === 'deal_quote').length
      },
      statusBreakdown: {
        pending: requests.filter(r => r.status === 'pending').length,
        responded: requests.filter(r => r.status === 'responded').length,
        accepted: requests.filter(r => r.status === 'accepted').length,
        completed: requests.filter(r => r.status === 'completed').length,
        rejected: requests.filter(r => r.status === 'rejected').length
      },
      priorityBreakdown: {
        urgent: requests.filter(r => r.unified.priorityLevel === 'urgent').length,
        high: requests.filter(r => r.unified.priorityLevel === 'high').length,
        medium: requests.filter(r => r.unified.priorityLevel === 'medium').length,
        normal: requests.filter(r => r.unified.priorityLevel === 'normal').length
      }
    };
    
    res.status(200).json({
      success: true,
      message: "Dashboard summary retrieved successfully",
      data: summary
    });
    
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
      error: {
        code: "FETCH_ERROR",
        details: error.message
      }
    });
  }
});

export default unifiedQuoteRoutes;
