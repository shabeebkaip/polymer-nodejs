import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import Finance from "../../../models/finance.js";

const getFinanceDetail = express.Router();

getFinanceDetail.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid finance request ID format",
        error: {
          code: "INVALID_ID",
          details: "Please provide a valid finance request ID"
        }
      });
    }

    const financeRequest = await Finance.findOne({ 
      _id: id,
      userId: userId // Ensure user can only access their own requests
    })
      .populate({
        path: "userId",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "productId", 
        select: "productName chemicalName description tradeName productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName email phone company address city state country",
        }
      });

    if (!financeRequest) {
      return res.status(404).json({ 
        success: false,
        message: "Finance request not found",
        error: {
          code: "NOT_FOUND",
          details: "The requested finance request does not exist or you don't have permission to access it"
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Finance request details retrieved successfully",
      data: financeRequest,
    });

  } catch (error) {
    console.error("Error fetching finance request detail:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch finance request details",
      error: {
        code: "FETCH_ERROR",
        details: error.message
      }
    });
  }
});

export default getFinanceDetail;
