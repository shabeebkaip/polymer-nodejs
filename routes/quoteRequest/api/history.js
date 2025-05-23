import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import QuoteRequest from "../../../models/quoteRequest.js";

const getUserQuotes = express.Router();

getUserQuotes.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const total = await QuoteRequest.countDocuments({ user: userId });

    const userRequests = await QuoteRequest.find({ user: userId })
    .populate({
      path: "product",
      select: "productName createdBy", 
      populate: {
        path: "createdBy",
        select: "firstName lastName company email", 
      },
    })
      .populate({ path: "grade", select: "name" })   
      .populate({ path: "incoterm", select: "name" })
      .populate({ path: "packagingType", select: "name" })   
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
    console.error("Error fetching user quote requests:", err);
    res.status(500).json({ error: "Failed to fetch user quote requests" });
  }
});

export default getUserQuotes;
