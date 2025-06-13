import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import getSellerBestDeals from "../aggregations/getSellerBestDeals.js";

const listBestDeals = express.Router();

listBestDeals.get("/", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;

    const bestDeals = await getSellerBestDeals(sellerId);

    res.status(200).json(bestDeals);
  } catch (err) {
    console.error("Error fetching best deals:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default listBestDeals;
