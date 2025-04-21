import express from "express";
import Appearance from "../../../models/appearance.js";

const createAppearance = express.Router();

createAppearance.post("/", async (req, res) => {
  try {
    // Check if request body is an array for bulk operation
    if (Array.isArray(req.body)) {
      // Validate the array is not empty and has reasonable length
      if (req.body.length === 0) {
        return res.status(400).json({
          message: "Empty array provided for bulk insertion",
          success: false,
          statusCode: 400,
        });
      }

      if (req.body.length > 1000) {
        return res.status(413).json({
          message: "Too many items in bulk request (max 1000)",
          success: false,
          statusCode: 413,
        });
      }

      // Validate each item has the required 'name' field
      const invalidItems = req.body.filter((item) => !item.name);
      if (invalidItems.length > 0) {
        return res.status(400).json({
          message: `${invalidItems.length} items missing required 'name' field`,
          success: false,
          statusCode: 400,
          invalidItems: invalidItems.map((item, index) => ({ index, item })),
        });
      }

      // Process bulk insert with error handling
      const result = await Appearance.insertMany(req.body, { ordered: false });

      return res.status(201).json({
        message: `Successfully created ${result.length} appearances`,
        success: true,
        statusCode: 201,
        data: result,
      });
    }

    // Handle single appearance creation
    if (!req.body.name) {
      return res.status(400).json({
        message: "Name field is required",
        success: false,
        statusCode: 400,
      });
    }

    const appearance = new Appearance(req.body);
    await appearance.save();

    return res.status(201).json({
      message: "Appearance created successfully",
      success: true,
      statusCode: 201,
      data: appearance,
    });
  } catch (error) {
    console.error("Error creating appearance(s):", error);

    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate appearance detected",
        success: false,
        statusCode: 409,
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
        success: false,
        statusCode: 400,
      });
    }

    // Handle bulk write errors
    if (error.name === "BulkWriteError") {
      const insertedCount = error.result?.insertedCount || 0;
      const errorCount = error.writeErrors?.length || 0;

      return res.status(207).json({
        // 207 Multi-Status
        message: `Partial success: ${insertedCount} created, ${errorCount} failed`,
        success: false,
        statusCode: 207,
        insertedCount,
        errorCount,
        errors: error.writeErrors?.map((e) => e.errmsg),
      });
    }

    // Generic error handler
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
  }
});

export default createAppearance;
