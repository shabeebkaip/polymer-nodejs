import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import mongoose from "mongoose";
import SampleRequest from "../../../models/sampleRequest.js"; // Assuming this is your model file

const sampleRequestRouter = express.Router();

sampleRequestRouter.post("", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    console.log("Authenticated user:", user); // Log the authenticated user
    const {
      product,
      quantity,
      purchase_plan,
      application,
      message = "", // Optional field with default
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

    // Create new sample request
    const newSampleRequest = new SampleRequest({
      user: user.id, // Associate the request with the authenticated user
      product,
      quantity: Number(quantity),
      purchase_plan,
      application,
      expected_annual_volume: Number(expected_annual_volume),
      industry,
      uom,
      message: message.trim(), // Optional field
      address,
      status: "pending", // Default status
    });
    console.log("New sample request:", newSampleRequest); // Log the new sample request

    // Save to database
    const savedRequest = await newSampleRequest.save();

    // // Populate references if needed
    const populatedRequest = await SampleRequest.findById(savedRequest._id)
      .populate("product", "name") // Adjust fields as needed
      .populate("industry", "name"); // Adjust fields as needed

    return res.status(201).json({
      success: true,
      message: "Sample request created successfully",
      data: populatedRequest,
    });
  } catch (error) {
    console.error("Error creating sample request:", error);

    // Handle mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    // Handle duplicate key errors
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

sampleRequestRouter.get("", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    console.log("Authenticated user:", user); // Log the authenticated user

    // Fetch sample requests for the authenticated user
    const sampleRequests = await SampleRequest.find({ user: user.id })
      .populate("product", "name") // Adjust fields as needed
      .populate("industry", "name"); // Adjust fields as needed

    return res.status(200).json({
      success: true,
      message: "Sample requests fetched successfully",
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
