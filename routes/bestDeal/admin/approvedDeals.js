import express from "express";
import BestDeal from "../../../models/bestDeal.js";

const listApprovedDeals = express.Router();

listApprovedDeals.get("/", async (req, res) => {
  try {
    // Fetch only approved best deals with valid (non-expired) validity dates
    const query = {
      status: "approved",
      $or: [
        { validity: { $gte: new Date() } }, // Future validity
        { validity: { $exists: false } }, // Or no validity set
        { validity: null } // Or null validity
      ]
    };

    const approvedDeals = await BestDeal.find(query)
      .populate("productId", "productName price productImages description category")
      .populate("sellerId", "name email company")
      .sort({ createdAt: -1 }); // Show newest deals first

    // Filter out any deals where product or seller doesn't exist
    const validDeals = approvedDeals.filter(deal => deal.productId && deal.sellerId);

    res.status(200).json({
      success: true,
      count: validDeals.length,
      data: validDeals
    });
  } catch (err) {
    console.error("Error fetching approved best deals:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
});

// Optional: Get a single approved best deal by ID
listApprovedDeals.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const approvedDeal = await BestDeal.findOne({ 
      _id: id, 
      status: "approved",
      $or: [
        { validity: { $gte: new Date() } }, // Future validity
        { validity: { $exists: false } }, // Or no validity set
        { validity: null } // Or null validity
      ]
    })
      .populate("productId", "productName price productImages description category")
      .populate("sellerId", "name email company");

    if (!approvedDeal) {
      return res.status(404).json({ 
        success: false,
        message: "Approved best deal not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: approvedDeal
    });
  } catch (err) {
    console.error("Error fetching single approved best deal:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
});

// Optional: Get approved deals by category
listApprovedDeals.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    
    const query = {
      status: "approved",
      $or: [
        { validity: { $gte: new Date() } }, // Future validity
        { validity: { $exists: false } }, // Or no validity set
        { validity: null } // Or null validity
      ]
    };

    const approvedDeals = await BestDeal.find(query)
      .populate({
        path: "productId",
        match: { category: category },
        select: "productName price productImages description category"
      })
      .populate("sellerId", "name email conpany")
      .sort({ createdAt: -1 });

    // Filter out deals where productId is null (didn't match category)
    const categoryDeals = approvedDeals.filter(deal => deal.productId);

    res.status(200).json({
      success: true,
      category: category,
      count: categoryDeals.length,
      data: categoryDeals
    });
  } catch (err) {
    console.error("Error fetching approved deals by category:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
});

export default listApprovedDeals;