import express from "express";
import Product from "../../../models/product.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";
import QuoteRequestHelper from "../../../utils/quoteRequestHelper.js";

const recivedRouter = express.Router();

recivedRouter.get("/", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const priority = req.query.priority || "";  // urgent, high, medium, normal
    const dateFrom = req.query.dateFrom || "";
    const dateTo = req.query.dateTo || "";
    const skip = (page - 1) * limit;

    const sellerProducts = await Product.find({ createdBy: sellerId }).select("_id");
    const productIds = sellerProducts.map(p => p._id);

    // Build search query - only for product quotes since sellers deal with product quotes
    let searchQuery = { 
      product: { $in: productIds },
      requestType: "product_quote"  // Only show product quotes to sellers
    };
    
    // Add date range filter
    if (dateFrom || dateTo) {
      searchQuery.createdAt = {};
      if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
    }
    
    if (search) {
      // First, find products that match the search term
      const matchingProducts = await Product.find({
        createdBy: sellerId,
        $or: [
          { productName: { $regex: search, $options: "i" } },
          { chemicalName: { $regex: search, $options: "i" } },
          { tradeName: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      
      const searchProductIds = matchingProducts.map(p => p._id);
      
      searchQuery.$or = [
        { product: { $in: searchProductIds } }, // Search by product name
        { message: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { application: { $regex: search, $options: "i" } }
      ];
    }
    if (status) {
      searchQuery.status = status;
    }

    const total = await UnifiedQuoteRequest.countDocuments(searchQuery);
    const requests = await UnifiedQuoteRequest.find(searchQuery)
      .populate({ 
        path: "product", 
        select: "productName chemicalName tradeName countryOfOrigin color",
        populate: {
          path: "category",
          select: "name"
        }
      })
      .populate({ path: "grade", select: "name" })
      .populate({ path: "incoterm", select: "name" })
      .populate({ path: "packagingType", select: "name" })   
      .populate({ 
        path: "buyerId", 
        select: "firstName lastName company email phone"
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map(request => {
      const formatted = QuoteRequestHelper.formatUnifiedResponse(request);
      
      // Get the buyer information from buyerId field only
      const buyer = formatted.buyerId;
      if (buyer) {
        formatted.buyer = {
          _id: buyer._id,
          name: `${buyer.firstName} ${buyer.lastName}`.trim(),
          company: buyer.company,
          email: buyer.email,
          phone: buyer.phone
        };
        // Clean up original field
        delete formatted.buyerId;
      }
      
      return {
        _id: formatted._id,
        requestType: formatted.requestType,
        status: formatted.status,
        message: formatted.message,
        createdAt: formatted.createdAt,
        updatedAt: formatted.updatedAt,
        buyer: formatted.buyer,
        product: formatted.product ? {
          _id: formatted.product._id,
          productName: formatted.product.productName,
          chemicalName: formatted.product.chemicalName,
          tradeName: formatted.product.tradeName,
          countryOfOrigin: formatted.product.countryOfOrigin,
          color: formatted.product.color,
          category: formatted.product.category?.name
        } : null,
        orderDetails: {
          quantity: formatted.quantity,
          uom: formatted.uom,
          destination: formatted.destination,
          country: formatted.country,
          deliveryDate: formatted.delivery_date,
          application: formatted.application,
          packagingSize: formatted.packaging_size,
          expectedAnnualVolume: formatted.expected_annual_volume
        },
        specifications: {
          grade: formatted.grade?.name,
          incoterm: formatted.incoterm?.name,
          packagingType: formatted.packagingType?.name
        },
        unified: formatted.unified,
        // Additional seller-focused fields
        businessValue: {
          estimatedValue: formatted.quantity && formatted.price 
            ? formatted.quantity * formatted.price 
            : null,
          potentialAnnualValue: formatted.expected_annual_volume && formatted.price
            ? formatted.expected_annual_volume * formatted.price
            : null,
          priority: formatted.unified?.priorityLevel || 'normal'
        }
      };
    });

    // Apply priority filter after formatting (since priority is calculated)
    let filteredRequests = formattedRequests;
    if (priority) {
      filteredRequests = formattedRequests.filter(req => 
        req.businessValue.priority === priority
      );
    }

    // Get status summary for seller dashboard
    const statusCounts = await UnifiedQuoteRequest.aggregate([
      { 
        $match: { 
          product: { $in: productIds },
          requestType: "product_quote"
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusSummary = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: "Quote requests for seller's products retrieved successfully",
      data: filteredRequests,
      meta: {
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          count: filteredRequests.length,
          limit
        },
        filters: {
          search,
          status,
          priority,
          dateFrom,
          dateTo,
          requestType: "product_quote"
        },
        summary: {
          totalRequests: total,
          currentPage: page,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
          statusBreakdown: statusSummary,
          availableStatuses: [
            "pending", "responded", "negotiation", "accepted", 
            "in_progress", "shipped", "delivered", "completed", 
            "rejected", "cancelled"
          ],
          availablePriorities: ["urgent", "high", "medium", "normal"]
        }
      }
    });
  } catch (err) {
    console.error("Error fetching requests for seller's products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quote requests for seller's products",
      error: {
        code: "FETCH_ERROR",
        details: err.message
      }
    });
  }
});

recivedRouter.get("/:id", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid quote request ID format",
        error: {
          code: "INVALID_ID",
          details: "Please provide a valid quote request ID"
        }
      });
    }

    // Find all products owned by this seller
    const sellerProducts = await Product.find({ createdBy: sellerId }).select("_id");
    const productIds = sellerProducts.map(p => p._id.toString());

    // Find the quote request and ensure it is for a product owned by this seller
    const quoteRequest = await UnifiedQuoteRequest.findOne({
      _id: id,
      requestType: "product_quote"  // Only product quotes for sellers
    })
      .populate({
        path: "product",
        select: "productName chemicalName description tradeName productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy category subCategory",
        populate: [
          {
            path: "createdBy",
            select: "firstName lastName email phone company address city state country",
          },
          {
            path: "category",
            select: "name description",
          },
          {
            path: "subCategory",
            select: "name description",
          }
        ]
      })
      .populate({
        path: "grade",
        select: "name description",
      })
      .populate({
        path: "incoterm",
        select: "name description",
      })
      .populate({
        path: "packagingType",
        select: "name description",
      })
      .populate({
        path: "buyerId",
        select: "firstName lastName email phone company address city state country pincode userType",
      });

    if (!quoteRequest || !productIds.includes(quoteRequest.product._id.toString())) {
      return res.status(404).json({
        success: false,
        message: "Quote request not found or you do not have access to this request",
        error: {
          code: "NOT_FOUND",
          details: "No such quote request for your products"
        }
      });
    }

    // Format response using helper
    const formattedResponse = QuoteRequestHelper.formatUnifiedResponse(quoteRequest);
    
    // Get the buyer information from buyerId field only
    const buyer = formattedResponse.buyerId;
    
    // Enhanced response structure for sellers
    const responseData = {
      _id: formattedResponse._id,
      requestType: formattedResponse.requestType,
      status: formattedResponse.status,
      message: formattedResponse.message,
      createdAt: formattedResponse.createdAt,
      updatedAt: formattedResponse.updatedAt,
      statusHistory: formattedResponse.statusMessage || [],
      
      // Buyer information
      buyer: buyer ? {
        _id: buyer._id,
        name: `${buyer.firstName} ${buyer.lastName}`.trim(),
        email: buyer.email,
        phone: buyer.phone,
        company: buyer.company,
        address: {
          full: buyer.address,
          city: buyer.city,
          state: buyer.state,
          country: buyer.country,
          pincode: buyer.pincode
        },
        userType: buyer.userType
      } : null,
      
      // Product information (seller's product)
      product: formattedResponse.product ? {
        _id: formattedResponse.product._id,
        productName: formattedResponse.product.productName,
        chemicalName: formattedResponse.product.chemicalName,
        tradeName: formattedResponse.product.tradeName,
        description: formattedResponse.product.description,
        productImages: formattedResponse.product.productImages || [],
        countryOfOrigin: formattedResponse.product.countryOfOrigin,
        color: formattedResponse.product.color,
        manufacturingMethod: formattedResponse.product.manufacturingMethod,
        category: formattedResponse.product.category ? {
          _id: formattedResponse.product.category._id,
          name: formattedResponse.product.category.name,
          description: formattedResponse.product.category.description
        } : null,
        subCategory: formattedResponse.product.subCategory ? {
          _id: formattedResponse.product.subCategory._id,
          name: formattedResponse.product.subCategory.name,
          description: formattedResponse.product.subCategory.description
        } : null,
        specifications: {
          density: formattedResponse.product.density,
          mfi: formattedResponse.product.mfi,
          tensileStrength: formattedResponse.product.tensileStrength,
          elongationAtBreak: formattedResponse.product.elongationAtBreak,
          shoreHardness: formattedResponse.product.shoreHardness,
          waterAbsorption: formattedResponse.product.waterAbsorption
        },
        isOwnProduct: true // Indicate this is seller's own product
      } : null,
      
      // Order details requested by buyer
      orderDetails: {
        quantity: formattedResponse.quantity,
        uom: formattedResponse.uom,
        destination: formattedResponse.destination,
        country: formattedResponse.country,
        deliveryDate: formattedResponse.delivery_date,
        application: formattedResponse.application,
        packagingSize: formattedResponse.packaging_size,
        expectedAnnualVolume: formattedResponse.expected_annual_volume,
        leadTime: formattedResponse.lead_time,
        terms: formattedResponse.terms,
        requestedPrice: formattedResponse.price
      },
      
      // Specifications requested
      specifications: {
        grade: formattedResponse.grade,
        incoterm: formattedResponse.incoterm,
        packagingType: formattedResponse.packagingType
      },
      
      // Unified fields for easier frontend handling
      unified: formattedResponse.unified,
      
      // Business context for seller
      businessContext: {
        isUrgent: formattedResponse.unified?.priorityLevel === 'urgent',
        estimatedValue: formattedResponse.quantity && formattedResponse.price 
          ? formattedResponse.quantity * formattedResponse.price 
          : null,
        potentialAnnualValue: formattedResponse.expected_annual_volume && formattedResponse.price
          ? formattedResponse.expected_annual_volume * formattedResponse.price
          : null,
        buyerLocation: buyer?.country,
        shippingRequired: formattedResponse.destination !== formattedResponse.product?.countryOfOrigin
      }
    };

    res.status(200).json({
      success: true,
      message: "Quote request detail retrieved successfully",
      data: responseData
    });
  } catch (err) {
    console.error("Error fetching quote request detail for seller:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quote request detail for seller",
      error: {
        code: "FETCH_ERROR",
        details: err.message
      }
    });
  }
});

export default recivedRouter;
