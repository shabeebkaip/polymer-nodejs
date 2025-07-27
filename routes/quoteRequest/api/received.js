import express from "express";
import Product from "../../../models/product.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";
import QuoteRequestHelper from "../../../utils/quoteRequestHelper.js";
import Grade from "../../../models/grade.js";

const recivedRouter = express.Router();

recivedRouter.get("/", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const priority = req.query.priority || ""; // urgent, high, medium, normal
    const dateFrom = req.query.dateFrom || "";
    const dateTo = req.query.dateTo || "";
    const skip = (page - 1) * limit;

    // --- PRODUCT QUOTES ---
    const sellerProducts = await Product.find({ createdBy: sellerId }).select(
      "_id"
    );
    const productIds = sellerProducts.map((p) => p._id);
    let productQuoteQuery = {
      product: { $in: productIds },
      requestType: "product_quote",
    };
    // --- DEAL QUOTES ---
    let dealQuoteQuery = {
      sellerId: sellerId,
      requestType: "deal_quote",
    };
    // Date range filter
    if (dateFrom || dateTo) {
      const createdAtFilter = {};
      if (dateFrom) createdAtFilter.$gte = new Date(dateFrom);
      if (dateTo) createdAtFilter.$lte = new Date(dateTo);
      productQuoteQuery.createdAt = { ...createdAtFilter };
      dealQuoteQuery.createdAt = { ...createdAtFilter };
    }
    // Status filter
    if (status) {
      productQuoteQuery.status = status;
      dealQuoteQuery.status = status;
    }
    // Search filter
    if (search) {
      // Product quote search
      const matchingProducts = await Product.find({
        createdBy: sellerId,
        $or: [
          { productName: { $regex: search, $options: "i" } },
          { chemicalName: { $regex: search, $options: "i" } },
          { tradeName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const searchProductIds = matchingProducts.map((p) => p._id);
      productQuoteQuery.$or = [
        { product: { $in: searchProductIds } },
        { message: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { application: { $regex: search, $options: "i" } },
      ];
      // Deal quote search
      dealQuoteQuery.$or = [
        { message: { $regex: search, $options: "i" } },
        { shippingCountry: { $regex: search, $options: "i" } },
        { paymentTerms: { $regex: search, $options: "i" } },
      ];
    }
    // --- Fetch both types ---
    const [productTotal, dealTotal] = await Promise.all([
      UnifiedQuoteRequest.countDocuments(productQuoteQuery),
      UnifiedQuoteRequest.countDocuments(dealQuoteQuery),
    ]);
    const productQuotes = await UnifiedQuoteRequest.find(productQuoteQuery)
      .populate({
        path: "product",
        select: "productName chemicalName tradeName countryOfOrigin color",
      })
      .populate({ path: "grade", select: "name" })
      .populate({ path: "incoterm", select: "name" })
      .populate({ path: "packagingType", select: "name" })
      .populate({
        path: "buyerId",
        select: "firstName lastName company email phone",
      })
      .sort({ createdAt: -1 });
    const dealQuotes = await UnifiedQuoteRequest.find(dealQuoteQuery)
      .populate({
        path: "bestDealId",
        select: "title description dealPrice productId",
        populate: { path: "productId", select: "productName" },
      })
      .populate({
        path: "buyerId",
        select: "firstName lastName company email phone",
      })
      .sort({ createdAt: -1 });
    // --- Format both types ---
    const formattedProductQuotes = productQuotes.map((request) => {
      const formatted = QuoteRequestHelper.formatUnifiedResponse(request);
      const buyer = formatted.buyerId;
      if (buyer) {
        formatted.buyer = {
          _id: buyer._id,
          name: `${buyer.firstName} ${buyer.lastName}`.trim(),
          company: buyer.company,
          email: buyer.email,
          phone: buyer.phone,
        };
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
        product: formatted.product
          ? {
              _id: formatted.product._id,
              productName: formatted.product.productName,
              chemicalName: formatted.product.chemicalName,
              tradeName: formatted.product.tradeName,
              countryOfOrigin: formatted.product.countryOfOrigin,
              color: formatted.product.color,
            }
          : null,
        orderDetails: {
          quantity: formatted.quantity,
          uom: formatted.uom,
          destination: formatted.destination,
          country: formatted.country,
          deliveryDate: formatted.delivery_date,
          application: formatted.application,
          packagingSize: formatted.packaging_size,
          expectedAnnualVolume: formatted.expected_annual_volume,
        },
        specifications: {
          grade: formatted.grade?.name,
          incoterm: formatted.incoterm?.name,
          packagingType: formatted.packagingType?.name,
        },
        unified: formatted.unified,
        businessValue: {
          estimatedValue:
            formatted.quantity && formatted.price
              ? formatted.quantity * formatted.price
              : null,
          potentialAnnualValue:
            formatted.expected_annual_volume && formatted.price
              ? formatted.expected_annual_volume * formatted.price
              : null,
          priority: formatted.unified?.priorityLevel || "normal",
        },
      };
    });
    const formattedDealQuotes = await Promise.all(
      dealQuotes.map(async (request) => {
        const formatted = QuoteRequestHelper.formatUnifiedResponse(request);
        const buyer = formatted.buyerId;
        if (buyer) {
          formatted.buyer = {
            _id: buyer._id,
            name: `${buyer.firstName} ${buyer.lastName}`.trim(),
            company: buyer.company,
            email: buyer.email,
            phone: buyer.phone,
          };
          delete formatted.buyerId;
        }
        // Get product name from products collection using productId from bestDealId
        let productName = null;
        if (formatted.bestDealId && formatted.bestDealId.productId) {
          const productDoc = await Product.findById(
            formatted.bestDealId.productId
          ).select("productName");
          if (productDoc) productName = productDoc.productName;
        }
        return {
          _id: formatted._id,
          requestType: formatted.requestType,
          status: formatted.status,
          message: formatted.message,
          createdAt: formatted.createdAt,
          updatedAt: formatted.updatedAt,
          buyer: formatted.buyer,
          deal: formatted.bestDealId
            ? {
                _id: formatted.bestDealId._id,
                title: productName, // <-- set title here
                description: formatted.bestDealId.description,
                dealPrice: formatted.bestDealId.dealPrice,
                productName: productName,
              }
            : null,
          orderDetails: {
            quantity: formatted.desiredQuantity,
            shippingCountry: formatted.shippingCountry,
            paymentTerms: formatted.paymentTerms,
            deliveryDeadline: formatted.deliveryDeadline,
          },
          unified: {
            ...formatted.unified,
            title: productName, // <-- set title in unified object
          },
          businessValue: {
            priority: formatted.unified?.priorityLevel || "normal",
          },
        };
      })
    );
    // --- Merge, paginate, and filter by priority ---
    let allRequests = [...formattedProductQuotes, ...formattedDealQuotes];
    // Sort by createdAt desc
    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Filter by priority if needed
    if (priority) {
      allRequests = allRequests.filter(
        (req) => req.businessValue.priority === priority
      );
    }
    // Pagination
    const total = allRequests.length;
    const paginatedRequests = allRequests.slice(skip, skip + limit);
    // Status summary (for product quotes only)
    const statusCounts = await UnifiedQuoteRequest.aggregate([
      {
        $match: { product: { $in: productIds }, requestType: "product_quote" },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusSummary = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    res.status(200).json({
      success: true,
      message:
        "Quote requests for seller's products and deals retrieved successfully",
      data: paginatedRequests,
      meta: {
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          count: paginatedRequests.length,
          limit,
        },
        filters: {
          search,
          status,
          priority,
          dateFrom,
          dateTo,
          requestType: "all",
        },
        summary: {
          totalRequests: total,
          currentPage: page,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
          statusBreakdown: statusSummary,
          availableStatuses: [
            "pending",
            "responded",
            "negotiation",
            "accepted",
            "in_progress",
            "shipped",
            "delivered",
            "completed",
            "rejected",
            "cancelled",
          ],
          availablePriorities: ["urgent", "high", "medium", "normal"],
        },
      },
    });
  } catch (err) {
    console.error("Error fetching requests for seller's products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quote requests for seller's products",
      error: {
        code: "FETCH_ERROR",
        details: err.message,
      },
    });
  }
});

recivedRouter.get("/:id", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote request ID format",
        error: {
          code: "INVALID_ID",
          details: "Please provide a valid quote request ID",
        },
      });
    }
    // Try product quote first
    let quoteRequest = await UnifiedQuoteRequest.findOne({
      _id: id,
      requestType: "product_quote",
    })
      .populate({
        path: "product",
        select:
          "productName chemicalName tradeName description productImages countryOfOrigin color manufacturingMethod createdBy color density mfi",
        populate: [{ path: "createdBy", select: "_id" }],
      })
      .populate({
        path: "buyerId",
        select:
          "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path:'packagingType',
        select: "name _id",
      })
      .populate({
        path: "grade",
        select: "name _id",
      })
      .populate({
        path: "incoterm",
        select: "name _id",
      })

    // If found, check ownership
    if (
      quoteRequest &&
      quoteRequest.product &&
      quoteRequest.product.createdBy &&
      quoteRequest.product.createdBy._id.toString() === sellerId.toString()
    ) {
      // Format product quote response
      const buyer = quoteRequest.buyerId;
      return res.status(200).json({
        success: true,
        message: "Quote request detail retrieved successfully",
        data: {
          _id: quoteRequest._id,
          requestType: quoteRequest.requestType,
          status: quoteRequest.status,
          message: quoteRequest.message,
          createdAt: quoteRequest.createdAt,
          updatedAt: quoteRequest.updatedAt,
          buyer: buyer
            ? {
                _id: buyer._id,
                name: `${buyer.firstName} ${buyer.lastName}`.trim(),
                email: buyer.email,
                phone: buyer.phone,
                company: buyer.company,
                address: buyer.address,
                userType: buyer.userType,
              }
            : null,
          product: quoteRequest.product
            ? {
                _id: quoteRequest.product._id,
                productName: quoteRequest.product.productName,
                chemicalName: quoteRequest.product.chemicalName,
                tradeName: quoteRequest.product.tradeName,
                description: quoteRequest.product.description,
                productImages: quoteRequest.product.productImages || [],
                countryOfOrigin: quoteRequest.product.countryOfOrigin,
                color: quoteRequest.product.color,
                manufacturingMethod: quoteRequest.product.manufacturingMethod,
                density: quoteRequest.product.density,
                mfi: quoteRequest.product.mfi
              }
            : null,
          orderDetails: {
            quantity: quoteRequest.quantity,
            uom: quoteRequest.uom,
            destination: quoteRequest.destination,
            country: quoteRequest.country,
            deliveryDate: quoteRequest.delivery_date,
            application: quoteRequest.application,
            packagingType: quoteRequest.packagingType,
            packagingSize: quoteRequest.packaging_size,
            expectedAnnualVolume: quoteRequest.expected_annual_volume,
            leadTime: quoteRequest.lead_time,
            terms: quoteRequest.terms,
            requestedPrice: quoteRequest.price,
            incoterm: quoteRequest.incoterm,
            grade: quoteRequest.grade,
            pricing: quoteRequest.pricing,
            expected_annual_volume: quoteRequest.expected_annual_volume,
          },
        },
      });
    }
    // Try deal quote next
    quoteRequest = await UnifiedQuoteRequest.findOne({
      _id: id,
      requestType: "deal_quote",
      sellerId,
    })
      .populate({
        path: "bestDealId",
        select: "title description dealPrice productId",
        populate: {
          path: "productId",
          select: "productName chemicalName tradeName",
        },
      })
      .populate({
        path: "buyerId",
        select:
          "firstName lastName email phone company address city state country pincode userType",
      });
    if (quoteRequest) {
      const buyer = quoteRequest.buyerId;
      let productName = null;
      if (
        quoteRequest.bestDealId &&
        quoteRequest.bestDealId.productId &&
        quoteRequest.bestDealId.productId.productName
      ) {
        productName = quoteRequest.bestDealId.productId.productName;
      }
      return res.status(200).json({
        success: true,
        message: "Quote request detail retrieved successfully",
        data: {
          _id: quoteRequest._id,
          requestType: quoteRequest.requestType,
          status: quoteRequest.status,
          message: quoteRequest.message,
          createdAt: quoteRequest.createdAt,
          updatedAt: quoteRequest.updatedAt,
          buyer: buyer
            ? {
                _id: buyer._id,
                name: `${buyer.firstName} ${buyer.lastName}`.trim(),
                email: buyer.email,
                phone: buyer.phone,
                company: buyer.company,
                address: buyer.address,
                userType: buyer.userType,
              }
            : null,
          deal: quoteRequest.bestDealId
            ? {
                _id: quoteRequest.bestDealId._id,
                title: productName,
                description: quoteRequest.bestDealId.description,
                dealPrice: quoteRequest.bestDealId.dealPrice,
                productName: productName,
              }
            : null,
          orderDetails: {
            quantity: quoteRequest.desiredQuantity,
            shippingCountry: quoteRequest.shippingCountry,
            paymentTerms: quoteRequest.paymentTerms,
            deliveryDeadline: quoteRequest.deliveryDeadline,
          },
        },
      });
    }
    // Not found
    return res.status(404).json({
      success: false,
      message:
        "Quote request not found or you do not have access to this request",
      error: {
        code: "NOT_FOUND",
        details: "No such quote request for your products or deals",
      },
    });
  } catch (err) {
    console.error("Error fetching quote request detail for seller:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quote request detail for seller",
      error: { code: "FETCH_ERROR", details: err.message },
    });
  }
});

export default recivedRouter;
