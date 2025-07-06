import express from "express";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";

const getAllQuotesRequests = express.Router();

getAllQuotesRequests.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, status, requestType } = req.query;

        // Build search query
        let searchQuery = {};

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            searchQuery.$or = [
                { message: searchRegex },
                { 'buyerId.firstName': searchRegex },
                { 'buyerId.lastName': searchRegex },
                { 'buyerId.company': searchRegex },
                { 'buyerId.email': searchRegex }
            ];
        }

        if (requestType && ['product_quote', 'deal_quote'].includes(requestType)) {
            searchQuery.requestType = requestType;
        }

        if (status) {
            searchQuery.status = status;
        }

        const totalRequests = await UnifiedQuoteRequest.countDocuments(searchQuery);

        const requests = await UnifiedQuoteRequest.find(searchQuery)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate({
                path: "product",
                select: "productName createdBy", 
                populate: {
                    path: "createdBy",
                    select: "firstName lastName company email", 
                },
            })
            .populate({
                path: "bestDealId",
                select: "offerPrice status",
                populate: {
                    path: "productId",
                    select: "productName"
                }
            })
            .populate({ path: "grade", select: "name" })   
            .populate({ path: "incoterm", select: "name" })
            .populate({ path: "packagingType", select: "name" })
            .populate({ path: "buyerId", select: "firstName lastName company email" });

        // Format the response to handle both quote types with standardized structure
        const formattedRequests = requests.map(request => {
            const requestObj = request.toObject();
            
            // Standardized base structure for both types
            const standardizedData = {
                _id: requestObj._id,
                requestType: requestObj.requestType,
                status: requestObj.status,
                message: requestObj.message,
                createdAt: requestObj.createdAt,
                updatedAt: requestObj.updatedAt,
                statusMessage: requestObj.statusMessage || [],
                
                // Standardized fields that work for both types
                productName: null,
                productId: null,
                company: null,
                companyId: null,
                quantity: null,
                unit: null,
                destination: null,
                deliveryDate: null,
                grade: null,
                
                // Buyer information (consistent for both)
                buyer: requestObj.buyerId ? {
                    _id: requestObj.buyerId._id,
                    firstName: requestObj.buyerId.firstName,
                    lastName: requestObj.buyerId.lastName,
                    name: `${requestObj.buyerId.firstName} ${requestObj.buyerId.lastName}`,
                    company: requestObj.buyerId.company,
                    email: requestObj.buyerId.email
                } : null,
                
                // Unified fields (consistent for both)
                unified: {
                    statusIcon: getStatusIcon(requestObj.status),
                    priorityLevel: null
                }
            };

            // Type-specific data mapping to standardized fields
            if (requestObj.requestType === 'product_quote') {
                standardizedData.quoteType = 'Product Quote';
                standardizedData.productName = requestObj.product?.productName || 'N/A';
                standardizedData.productId = requestObj.product?._id || null;
                standardizedData.company = requestObj.product?.createdBy?.company || 'N/A';
                standardizedData.companyId = requestObj.product?.createdBy?._id || null;
                standardizedData.quantity = requestObj.quantity || 'N/A';
                standardizedData.unit = requestObj.uom || 'N/A';
                standardizedData.destination = requestObj.destination || requestObj.country || 'N/A';
                standardizedData.deliveryDate = requestObj.delivery_date;
                standardizedData.grade = requestObj.grade?.name || 'N/A';
                
                // Additional product-specific details
                standardizedData.productQuote = {
                    product: requestObj.product,
                    application: requestObj.application,
                    terms: requestObj.terms,
                    packaging_size: requestObj.packaging_size,
                    lead_time: requestObj.lead_time,
                    incoterm: requestObj.incoterm,
                    packagingType: requestObj.packagingType,
                    price: requestObj.price
                };
                
                standardizedData.unified.quantity = requestObj.quantity;
                standardizedData.unified.deliveryDate = requestObj.delivery_date;
                standardizedData.unified.location = requestObj.country;
                standardizedData.unified.productInfo = requestObj.product?.productName || 'Product Quote';
                standardizedData.unified.type = 'product_quote';
                standardizedData.unified.title = requestObj.product?.productName || 'Product Quote';
                standardizedData.unified.priorityLevel = getPriorityLevel(requestObj.delivery_date);
                
            } else {
                // deal_quote
                standardizedData.quoteType = 'Deal Quote';
                standardizedData.productName = requestObj.bestDealId?.productId?.productName || 'N/A';
                standardizedData.productId = requestObj.bestDealId?.productId?._id || null;
                standardizedData.company = 'N/A'; // Deal quotes don't have a direct company
                standardizedData.companyId = null;
                standardizedData.quantity = requestObj.desiredQuantity || 'N/A';
                standardizedData.unit = 'N/A'; // Deal quotes don't specify unit
                standardizedData.destination = requestObj.shippingCountry || 'N/A';
                standardizedData.deliveryDate = requestObj.deliveryDeadline;
                standardizedData.grade = 'N/A'; // Deal quotes don't have grade
                
                // Additional deal-specific details
                standardizedData.dealQuote = {
                    bestDeal: requestObj.bestDealId,
                    paymentTerms: requestObj.paymentTerms,
                    offerPrice: requestObj.bestDealId?.offerPrice
                };
                
                standardizedData.unified.quantity = requestObj.desiredQuantity;
                standardizedData.unified.deliveryDate = requestObj.deliveryDeadline;
                standardizedData.unified.location = requestObj.shippingCountry;
                standardizedData.unified.productInfo = requestObj.bestDealId?.productId?.productName || 'Deal Quote';
                standardizedData.unified.type = 'deal_quote';
                standardizedData.unified.title = requestObj.bestDealId?.productId?.productName || 'Deal Quote';
                standardizedData.unified.priorityLevel = getPriorityLevel(requestObj.deliveryDeadline);
            }

            return standardizedData;
        });

        // Calculate summary statistics
        const summary = {
            totalRequests,
            productQuotes: formattedRequests.filter(req => req.requestType === 'product_quote').length,
            dealQuotes: formattedRequests.filter(req => req.requestType === 'deal_quote').length,
            statusBreakdown: {
                pending: formattedRequests.filter(req => req.status === 'pending').length,
                responded: formattedRequests.filter(req => req.status === 'responded').length,
                negotiation: formattedRequests.filter(req => req.status === 'negotiation').length,
                accepted: formattedRequests.filter(req => req.status === 'accepted').length,
                in_progress: formattedRequests.filter(req => req.status === 'in_progress').length,
                shipped: formattedRequests.filter(req => req.status === 'shipped').length,
                delivered: formattedRequests.filter(req => req.status === 'delivered').length,
                completed: formattedRequests.filter(req => req.status === 'completed').length,
                rejected: formattedRequests.filter(req => req.status === 'rejected').length,
                cancelled: formattedRequests.filter(req => req.status === 'cancelled').length
            }
        };
            
        res.status(200).json({
            success: true,
            message: "Quote requests retrieved successfully",
            data: formattedRequests,
            meta: {
                pagination: {
                    total: totalRequests,
                    page,
                    totalPages: Math.ceil(totalRequests / limit),
                    count: formattedRequests.length,
                    limit
                },
                filters: {
                    search,
                    status,
                    requestType: requestType || 'all'
                },
                summary
            }
        });
    } catch (err) {
        console.error("Error fetching all Quote requests:", err);
        res.status(500).json({ 
            success: false,
            message: "Failed to fetch quote requests",
            error: {
                code: "FETCH_ERROR",
                details: err.message
            }
        });
    }
});

// Helper functions for status and priority
function getStatusIcon(status) {
    const statusIconMap = {
        'pending': '⏳',
        'responded': '💬',
        'negotiation': '🤝',
        'accepted': '✅',
        'in_progress': '⚙️',
        'shipped': '🚚',
        'delivered': '📦',
        'completed': '🎉',
        'rejected': '❌',
        'cancelled': '🚫'
    };
    return statusIconMap[status] || '❓';
}

function getPriorityLevel(deliveryDate) {
    if (!deliveryDate) return 'normal';
    
    const now = new Date();
    const delivery = new Date(deliveryDate);
    const daysDiff = Math.ceil((delivery - now) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'urgent'; // Past due
    if (daysDiff <= 7) return 'urgent';
    if (daysDiff <= 14) return 'high';
    if (daysDiff <= 30) return 'medium';
    return 'normal';
}

export default getAllQuotesRequests;
