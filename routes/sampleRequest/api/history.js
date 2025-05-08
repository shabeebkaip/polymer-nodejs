import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const getUserSamples = express.Router();

getUserSamples.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const total = await SampleRequest.countDocuments({ user: userId });

    const userRequests = await SampleRequest.find({ user: userId })
      .populate({ path: "product", select: "productName" }) 
      .populate({ path: "grade", select: "name" })   
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      data: userRequests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: userRequests.length,
    });
  } catch (err) {
    console.error("Error fetching user sample requests:", err);
    res.status(500).json({ error: "Failed to fetch user sample requests" });
  }
});

export default getUserSamples;
