import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import mongoose from "mongoose";
import QuoteRequest from "../../../models/quoteRequest.js";

const quoteRequestRouter = express.Router();

// Aggregation pipeline helper function
const getQuoteRequestsAggregation = (additionalStages = []) => {
  return [
    // Lookup user details from auth collection
    {
      $lookup: {
        from: "auths",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    // Convert userDetails array to object
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Lookup product details
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: {
        path: "$productDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Lookup industry details
    {
      $lookup: {
        from: "industries",
        localField: "industry",
        foreignField: "_id",
        as: "industryDetails",
      },
    },
    {
      $unwind: {
        path: "$industryDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Project only the fields you need
    {
      $project: {
        quantity: 1,
        message: 1,
        application: 1,
        uom: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        "userDetails.name": 1,
        "userDetails.email": 1,
        "productDetails.name": 1,
        "productDetails.description": 1,
        "industryDetails.name": 1,
      },
    },
    // Sort by creation date (newest first)
    {
      $sort: {
        createdAt: -1,
      },
    },
    // Additional stages if provided
    ...additionalStages,
  ];
};

// POST endpoint - Create new quote request
quoteRequestRouter.post("", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const {
      product,
      quantity,
      message = "",
      application,
      industry,
      uom,
    } = req.body;

    // Validate required fields
    if (!product || !quantity || !application || !industry || !uom) {
      return res.status(400).json({
        success: false,
        message:
          "Product, quantity, application, industry, and UOM are required fields",
      });
    }

    // Validate quantity is a positive number
    if (isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number",
      });
    }

    // Validate MongoDB ID formats
    if (
      !mongoose.Types.ObjectId.isValid(product) ||
      !mongoose.Types.ObjectId.isValid(industry)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Create new quote request
    const newQuoteRequest = new QuoteRequest({
      user: user.id,
      product: new mongoose.Types.ObjectId(product),
      quantity: Number(quantity),
      message: message.trim(),
      application: application.trim(),
      industry: new mongoose.Types.ObjectId(industry),
      uom,
      status: "pending",
    });

    // Save to database
    const savedRequest = await newQuoteRequest.save();

    // Get the complete request using aggregation
    const [quoteRequest] = await QuoteRequest.aggregate([
      { $match: { _id: savedRequest._id } },
      ...getQuoteRequestsAggregation(),
    ]);

    return res.status(201).json({
      success: true,
      message: "Quote request created successfully",
      data: quoteRequest,
    });
  } catch (error) {
    console.error("Error creating quote request:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry error",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// GET endpoint - Fetch all quote requests for the user
quoteRequestRouter.get("", authenticateUser, async (req, res) => {
  try {
    const user = req.user;

    // Use aggregation pipeline with user filter
    const quoteRequests = await QuoteRequest.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(user.id) } },
      ...getQuoteRequestsAggregation(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Quote requests fetched successfully",
      data: quoteRequests,
    });
  } catch (error) {
    console.error("Error fetching quote requests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default quoteRequestRouter;
