import express from "express";
import Brand from "../../../models/brand.js";

const brandGet = express.Router();

brandGet.get("", async (req, res) => {
  try {
    const { page = 1, limit = 10, name } = req.query;
    const query = name ? { name: { $regex: name, $options: "i" } } : {};
    const brands = await Brand.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Brand.countDocuments(query);

    res.status(200).json({
      message: "Brands fetched successfully",
      success: true,
      statusCode: 200,
      data: {
        list: brands,
        pagination: {
          total,
          limit: parseInt(limit),
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting brand", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
  }
});

export default brandGet;
