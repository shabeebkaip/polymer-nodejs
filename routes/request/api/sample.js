import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import mongoose from "mongoose";
import SampleRequest from "../../../models/sampleRequest.js";

const sampleRequestRouter = express.Router();

// Aggregation pipeline helper function
const getSampleRequestsAggregation = (additionalStages = []) => {
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
        purchase_plan: 1,
        expected_annual_volume: 1,
        address: 1,
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

// POST endpoint - Create new sample request (requires authentication)
sampleRequestRouter.post("", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const {
      product,
      quantity,
      purchase_plan,
      application,
      message = "",
      expected_annual_volume,
      industry,
      uom,
      address,
    } = req.body;

    // Validate required fields
    if (
      !product ||
      !quantity ||
      !purchase_plan ||
      !application ||
      !expected_annual_volume ||
      !industry ||
      !uom ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate quantity and volume are numbers
    if (isNaN(quantity) || isNaN(expected_annual_volume)) {
      return res.status(400).json({
        success: false,
        message: "Quantity and expected annual volume must be numbers",
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

    // Create new sample request
    const newSampleRequest = new SampleRequest({
      user: user.id,
      product: new mongoose.Types.ObjectId(product),
      quantity: Number(quantity),
      purchase_plan: purchase_plan.trim(),
      application: application.trim(),
      expected_annual_volume: Number(expected_annual_volume),
      industry: new mongoose.Types.ObjectId(industry),
      uom,
      message: message.trim(),
      address,
      status: "pending",
    });

    // Save to database
    const savedRequest = await newSampleRequest.save();

    // Get the complete request using aggregation
    const [sampleRequest] = await SampleRequest.aggregate([
      { $match: { _id: savedRequest._id } },
      ...getSampleRequestsAggregation(),
    ]);

    return res.status(201).json({
      success: true,
      message: "Sample request created successfully",
      data: sampleRequest,
    });
  } catch (error) {
    console.error("Error creating sample request:", error);

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

// GET endpoint - Fetch all sample requests (no authentication required)
sampleRequestRouter.get("", async (req, res) => {
  try {
    // Use aggregation pipeline to get all sample requests
    const sampleRequests = await SampleRequest.aggregate([
      ...getSampleRequestsAggregation(),
    ]);

    return res.status(200).json({
      success: true,
      message: "All sample requests fetched successfully",
      data: sampleRequests,
    });
  } catch (error) {
    console.error("Error fetching sample requests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default sampleRequestRouter;