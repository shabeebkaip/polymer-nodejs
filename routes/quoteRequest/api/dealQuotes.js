import express from "express";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const dealQuotesRouter = express.Router();

// Get all deal quote requests for a seller
dealQuotesRouter.get("/", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter for deal quotes only
    const filter = {
      requestType: "deal_quote",
      sellerId: sellerId,
    };

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      filter.$or = [{ message: { $regex: search, $options: "i" } }];
    }

    // Get deal quotes with populated fields
    const dealQuotes = await UnifiedQuoteRequest.find(filter)
      .populate({
        path: "buyerId",
        select:
          "firstName lastName email phone company address city state country",
      })
      .populate({
        path: "bestDealId",
        select: "title description dealPrice productId",
        populate: {
          path: "productId",
          select:
            "productName chemicalName tradeName productImages countryOfOrigin color density mfi",
        },
      })
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UnifiedQuoteRequest.countDocuments(filter);

    // Get status summary
    const statusCounts = await UnifiedQuoteRequest.aggregate([
      { $match: { requestType: "deal_quote", sellerId: sellerId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusSummary = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Format response
    const formattedQuotes = dealQuotes.map((quote) => {
      const buyer = quote.buyerId;
      const deal = quote.bestDealId;
      const product = deal?.productId;

      return {
        _id: quote._id,
        requestType: quote.requestType,
        status: quote.status,
        message: quote.message,
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt,
        buyer: buyer
          ? {
              _id: buyer._id,
              name: `${buyer.firstName} ${buyer.lastName}`.trim(),
              email: buyer.email,
              phone: buyer.phone,
              company: buyer.company,
              address: buyer.address,
              location: `${buyer.city || ""}, ${buyer.country || ""}`.trim(),
            }
          : null,
        deal: deal
          ? {
              _id: deal._id,
              title: deal.title,
              description: deal.description,
              dealPrice: deal.dealPrice,
              productName: product?.productName || deal.title,
              productImage: product?.productImages?.[0]?.fileUrl || null,
            }
          : null,
        orderDetails: {
          quantity: quote.desiredQuantity,
          shippingCountry: quote.shippingCountry,
          paymentTerms: quote.paymentTerms,
          deliveryDeadline: quote.deliveryDeadline,
        },
      };
    });

    res.status(200).json({
      success: true,
      message: "Deal quote requests retrieved successfully",
      data: formattedQuotes,
      meta: {
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
        statusSummary,
      },
    });
  } catch (error) {
    console.error("Error fetching deal quotes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deal quote requests",
      error: { code: "FETCH_ERROR", details: error.message },
    });
  }
});

// Get single deal quote request by ID
dealQuotesRouter.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const quoteRequest = await UnifiedQuoteRequest.findOne({
      _id: id,
      requestType: "deal_quote",
      sellerId: sellerId,
    })
      .populate({
        path: "buyerId",
        select:
          "firstName lastName email phone company address city state country pincode",
      })
      .populate({
        path: "bestDealId",
        select: "title description dealPrice productId",
        populate: {
          path: "productId",
          select:
            "productName chemicalName tradeName description productImages countryOfOrigin color density mfi manufacturingMethod",
        },
      });

    if (!quoteRequest) {
      return res.status(404).json({
        success: false,
        message: "Deal quote request not found or you do not have access",
        error: {
          code: "NOT_FOUND",
          details: "No such deal quote request for your deals",
        },
      });
    }

    const buyer = quoteRequest.buyerId;
    const deal = quoteRequest.bestDealId;
    const product = deal?.productId;

    const formattedResponse = {
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
            city: buyer.city,
            state: buyer.state,
            country: buyer.country,
            pincode: buyer.pincode,
          }
        : null,
      deal: deal
        ? {
            _id: deal._id,
            title: deal.title,
            description: deal.description,
            dealPrice: deal.dealPrice,
            product: product
              ? {
                  _id: product._id,
                  productName: product.productName,
                  chemicalName: product.chemicalName,
                  tradeName: product.tradeName,
                  description: product.description,
                  productImages: product.productImages || [],
                  countryOfOrigin: product.countryOfOrigin,
                  color: product.color,
                  density: product.density,
                  mfi: product.mfi,
                  manufacturingMethod: product.manufacturingMethod,
                }
              : null,
          }
        : null,
      orderDetails: {
        quantity: quoteRequest.desiredQuantity,
        shippingCountry: quoteRequest.shippingCountry,
        paymentTerms: quoteRequest.paymentTerms,
        deliveryDeadline: quoteRequest.deliveryDeadline,
      },
    };

    res.status(200).json({
      success: true,
      message: "Deal quote request detail retrieved successfully",
      data: formattedResponse,
    });
  } catch (error) {
    console.error("Error fetching deal quote detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deal quote request detail",
      error: { code: "FETCH_ERROR", details: error.message },
    });
  }
});

export default dealQuotesRouter;
