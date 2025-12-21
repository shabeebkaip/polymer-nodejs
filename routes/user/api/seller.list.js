import express from "express";
import User from "../../../models/user.js";
import Product from "../../../models/product.js";
import { productAggregation } from "../../../repositories/product.repository.js";

const sellerList = express.Router();

sellerList.get("/list", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  try {
    const matchStage = {
      user_type: "seller",
      verification: "approved"
    };

    const usersWithProducts = await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "createdBy",
          as: "products"
        }
      },
      { $sort: { _id: -1 } },
      { $skip: (pageNumber - 1) * pageSize },
      { $limit: pageSize }
    ]);

    const enrichedUsers = [];

    for (const user of usersWithProducts) {
      const productIds = user.products.map((p) => p._id);

      let enrichedProducts = [];

      if (productIds.length > 0) {
        enrichedProducts = await Product.aggregate([
          { $match: { _id: { $in: productIds } } },
          ...productAggregation()
        ]);
      }

      enrichedUsers.push({
        ...user,
        products: enrichedProducts
      });
    }

    const total = await User.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      data: enrichedUsers,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error("Error fetching sellers with enriched products:", error);
    res.status(500).json({ message: "Server error while fetching sellers" });
  }
});

export default sellerList;
