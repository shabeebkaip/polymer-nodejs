import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";
import Notification from "../../../models/notification.js";
import Product from "../../../models/product.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const createSample = express.Router();

createSample.post("/", authenticateUser, async (req, res) => {
  try {
    const sampleRequest = new SampleRequest({
      ...req.body,
      user: req.user.id, 
    });

    const savedRequest = await sampleRequest.save();

    // Notify the seller (product owner) if productId is provided
    if (savedRequest.productId) {
      try {
        const product = await Product.findById(savedRequest.productId).populate('createdBy', '_id firstName lastName company');
        if (product && product.createdBy && product.createdBy._id) {
          await Notification.create({
            userId: product.createdBy._id,
            type: 'sample-enquiry',
            message: `New sample request for your product: ${product.productName?.en || product.productName}`,
            redirectUrl: `/user/sample-enquiries/${savedRequest._id}`,
            relatedId: savedRequest._id,
            meta: {
              requesterId: req.user.id,
              requesterName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim()
            }
          });
        }
      } catch (notifyErr) {
        console.error('Failed to notify seller for sample request:', notifyErr);
      }
    }

    res.status(201).json(savedRequest);
  } catch (err) {
    console.error("Error saving sample request:", err);
    res.status(400).json({ error: err.message });
  }
});

export default createSample;
