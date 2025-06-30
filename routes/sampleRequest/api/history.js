import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const getUserSamples = express.Router();

getUserSamples.get("/", authenticateUser, async (req, res) => {
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
        { "remarks": { $regex: search, $options: "i" } },
        { "address": { $regex: search, $options: "i" } },
        { "pincode": { $regex: search, $options: "i" } },
        { "city": { $regex: search, $options: "i" } },
        { "state": { $regex: search, $options: "i" } },
        { "country": { $regex: search, $options: "i" } }
      ];
    }

    // Add status filter
    if (status) {
      searchQuery.status = status;
    }

    const total = await SampleRequest.countDocuments(searchQuery);

    const userRequests = await SampleRequest.find(searchQuery)
      .populate({
        path: "product",
        select: "productName createdBy", 
        populate: {
          path: "createdBy",
          select: "firstName lastName company email", 
        },
      })
      .populate({
        path: "grade",
        select: "name",
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Sample requests retrieved successfully",
      data: userRequests,
      meta: {
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          count: userRequests.length,
          limit
        },
        filters: {
          search,
          status
        }
      }
    });
  } catch (err) {
    console.error("Error fetching user sample requests:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user sample requests",
      error: {
        code: "FETCH_ERROR",
        details: err.message
      }
    });
  }
});


export default getUserSamples;
