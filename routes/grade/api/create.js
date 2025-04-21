import express from "express";
import Grade from "../../../models/grade.js";

const createGrade = express.Router();

createGrade.post("/", async (req, res) => {
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

      // Validate each item has required field
      const invalidItems = req.body.filter((item) => !item.name);

      if (invalidItems.length > 0) {
        return res.status(400).json({
          message: `${invalidItems.length} items missing required 'name' field`,
          success: false,
          statusCode: 400,
          invalidItems: invalidItems.map((item, index) => ({
            index,
            missingField: !item.name,
          })),
        });
      }

      // Process bulk insert
      const result = await Grade.insertMany(req.body, { ordered: false });

      return res.status(201).json({
        message: `Successfully created ${result.length} grades`,
        success: true,
        statusCode: 201,
        data: result,
      });
    }

    // Single creation logic
    if (!req.body.name) {
      return res.status(400).json({
        message: "Name field is required",
        success: false,
        statusCode: 400,
      });
    }

    const grade = new Grade(req.body);
    await grade.save();

    return res.status(201).json({
      message: "Grade created successfully",
      success: true,
      statusCode: 201,
      data: grade,
    });
  } catch (error) {
    console.error("Error creating grade(s):", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate grade detected (name may already exist)",
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

export default createGrade;
