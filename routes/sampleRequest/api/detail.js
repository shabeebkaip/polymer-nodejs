import express from 'express';
import SampleRequest from '../../../models/sampleRequest.js';   
import { authenticateUser } from '../../../middlewares/verify.token.js';

const sampleRequestDetailRouter = express.Router();

sampleRequestDetailRouter.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid sample request ID" });
    }

    const sampleRequest = await SampleRequest.findOne({ 
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
      });

    if (!sampleRequest) {
      return res.status(404).json({ message: "Sample request not found" });
    }

    res.status(200).json({
      success: true,
      data: sampleRequest,
    });

  } catch (error) {
    console.error("Error fetching sample request detail:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch sample request details",
      error: error.message 
    });
  }
});

export default sampleRequestDetailRouter;