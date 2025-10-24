import express from "express";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";
import Product from "../../../models/product.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const productQuotesRouter = express.Router();

// Get all product quote requests for a seller
productQuotesRouter.get("/", authenticateUser, async (req, res) => {
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

    // Get seller's products
    const sellerProducts = await Product.find({ createdBy: sellerId }).select(
      "_id"
    );
    const productIds = sellerProducts.map((p) => p._id);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found for this seller",
        data: [],
        meta: {
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
          },
          statusSummary: {},
        },
      });
    }

    // Build filter for product quotes only
    const filter = {
      requestType: "product_quote",
      product: { $in: productIds },
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
      filter.$or = [
        { destination: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }

    // Get product quotes with populated fields
    const productQuotes = await UnifiedQuoteRequest.find(filter)
      .populate({
        path: "buyerId",
        select:
          "firstName lastName email phone company address city state country",
      })
      .populate({
        path: "product",
        select:
          "productName chemicalName tradeName description productImages countryOfOrigin color density mfi manufacturingMethod",
      })
      .populate("packagingType", "name")
      .populate("incoterm", "name")
      .populate("grade", "name")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UnifiedQuoteRequest.countDocuments(filter);

    // Get status summary
    const statusCounts = await UnifiedQuoteRequest.aggregate([
      {
        $match: { requestType: "product_quote", product: { $in: productIds } },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusSummary = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Format response
    const formattedQuotes = productQuotes.map((quote) => {
      const buyer = quote.buyerId;
      const product = quote.product;

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
        product: product
          ? {
              _id: product._id,
              productName: product.productName,
              chemicalName: product.chemicalName,
              tradeName: product.tradeName,
              countryOfOrigin: product.countryOfOrigin,
              color: product.color,
              productImage: product.productImages?.[0]?.fileUrl || null,
            }
          : null,
        orderDetails: {
          quantity: quote.quantity,
          uom: quote.uom,
          destination: quote.destination,
          country: quote.country,
          deliveryDate: quote.delivery_date,
          application: quote.application,
          packagingType: quote.packagingType?.name,
          packagingSize: quote.packaging_size,
          expectedAnnualVolume: quote.expected_annual_volume,
          incoterm: quote.incoterm?.name,
          grade: quote.grade?.name,
        },
      };
    });

    res.status(200).json({
      success: true,
      message: "Product quote requests retrieved successfully",
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
    console.error("Error fetching product quotes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product quote requests",
      error: { code: "FETCH_ERROR", details: error.message },
    });
  }
});

// Get single product quote request by ID
productQuotesRouter.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    // Get seller's products
    const sellerProducts = await Product.find({ createdBy: sellerId }).select(
      "_id"
    );
    const productIds = sellerProducts.map((p) => p._id);

    const quoteRequest = await UnifiedQuoteRequest.findOne({
      _id: id,
      requestType: "product_quote",
      product: { $in: productIds },
    })
      .populate({
        path: "buyerId",
        select:
          "firstName lastName email phone company address city state country pincode",
      })
      .populate({
        path: "product",
        select:
          "productName chemicalName tradeName description productImages countryOfOrigin color density mfi manufacturingMethod",
      })
      .populate("packagingType", "name")
      .populate("incoterm", "name")
      .populate("grade", "name");

    if (!quoteRequest) {
      return res.status(404).json({
        success: false,
        message: "Product quote request not found or you do not have access",
        error: {
          code: "NOT_FOUND",
          details: "No such product quote request for your products",
        },
      });
    }

    const buyer = quoteRequest.buyerId;
    const product = quoteRequest.product;

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
      },
    };

    res.status(200).json({
      success: true,
      message: "Product quote request detail retrieved successfully",
      data: formattedResponse,
    });
  } catch (error) {
    console.error("Error fetching product quote detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product quote request detail",
      error: { code: "FETCH_ERROR", details: error.message },
    });
  }
});

export default productQuotesRouter;
