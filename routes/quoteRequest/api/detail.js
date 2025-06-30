import express from 'express';
import QuoteRequest from '../../../models/quoteRequest.js';   
import { authenticateUser } from '../../../middlewares/verify.token.js';

const quoteRequestDetailRouter = express.Router();

quoteRequestDetailRouter.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid quote request ID" });
    }

    const quoteRequest = await QuoteRequest.findOne({ 
      _id: id,
      user: userId // Ensure user can only access their own requests
    })
      .populate({
        path: "user",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "product",
        select: "productName chemicalName description tradeName productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName email phone company address city state country",
        }
      })
      .populate({
        path: "grade",
        select: "name description",
      })
      .populate({
        path: "incoterm",
        select: "name description",
      })
      .populate({
        path: "packagingType",
        select: "name description",
      });

    if (!quoteRequest) {
      return res.status(404).json({ message: "Quote request not found" });
    }

    res.status(200).json({
      success: true,
      data: quoteRequest,
    });

  } catch (error) {
    console.error("Error fetching quote request detail:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch quote request details",
      error: error.message 
    });
  }
});

export default quoteRequestDetailRouter;
