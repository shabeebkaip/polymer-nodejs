import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import QuoteRequest from "../../../models/quoteRequest.js";

const getUserQuotes = express.Router();

getUserQuotes.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = { user: userId };

    // Add search filters
    if (search) {
      searchQuery.$or = [
        { "destination": { $regex: search, $options: "i" } },
        { "country": { $regex: search, $options: "i" } },
        { "application": { $regex: search, $options: "i" } },
        { "message": { $regex: search, $options: "i" } },
        { "terms": { $regex: search, $options: "i" } },
        { "packaging_size": { $regex: search, $options: "i" } },
        { "lead_time": { $regex: search, $options: "i" } }
      ];
    }

    // Add status filter
    if (status) {
      searchQuery.status = status;
    }

    const total = await QuoteRequest.countDocuments(searchQuery);

    const userRequests = await QuoteRequest.find(searchQuery)
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
      search,
      status,
    });
  } catch (err) {
    console.error("Error fetching user quote requests:", err);
    res.status(500).json({ error: "Failed to fetch user quote requests" });
  }
});

export default getUserQuotes;
