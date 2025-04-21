import express from "express";
import Substance from "../../../models/substance.js";

const createSubstance = express.Router();

createSubstance.post("/", async (req, res) => {
  try {
    // Bulk creation logic
    if (Array.isArray(req.body)) {
      // Validate array is not empty
      if (req.body.length === 0) {
        return res.status(400).json({
          message: "Empty array provided for bulk insertion",
          success: false,
          statusCode: 400,
        });
      }

      // Validate each item has required fields
      const invalidItems = req.body.filter(
        (item) => !item.name || !item.cas_number
      );

      if (invalidItems.length > 0) {
        return res.status(400).json({
          message: `${invalidItems.length} items missing required fields (name or cas_number)`,
          success: false,
          statusCode: 400,
          invalidItems: invalidItems.map((item, index) => ({
            index,
            missingFields: {
              name: !item.name,
              cas_number: !item.cas_number,
            },
          })),
        });
      }

      // Process bulk insert
      const result = await Substance.insertMany(req.body, { ordered: false });

      return res.status(201).json({
        message: `Successfully created ${result.length} substances`,
        success: true,
        statusCode: 201,
        data: result,
      });
    }

    // Single creation logic
    if (!req.body.name || !req.body.cas_number) {
      return res.status(400).json({
        message: "Both name and cas_number are required",
        success: false,
        statusCode: 400,
        missingFields: {
          name: !req.body.name,
          cas_number: !req.body.cas_number,
        },
      });
    }

    const substance = new Substance(req.body);
    await substance.save();

    return res.status(201).json({
      message: "Substance created successfully",
      success: true,
      statusCode: 201,
      data: substance,
    });
  } catch (error) {
    console.error("Error creating substance(s):", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate substance detected (name or CAS number may already exist)",
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
        message: `Partial success: ${insertedCount} created, ${errorCount} failed`,
        success: insertedCount > 0,
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

export default createSubstance;
