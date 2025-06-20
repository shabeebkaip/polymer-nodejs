import express from "express";
import Product from "../../../models/product.js";
import User from "../../../models/user.js";

const adminProductList = express.Router();

adminProductList.get("/list", async (req, res) => {
  try {
    // Find all users with user_type 'superAdmin'
    const admins = await User.find({ user_type: "superAdmin" }, "_id");

    const adminIds = admins.map((admin) => admin._id);

    // Fetch products created by admin users
    const products = await Product.find({ createdBy: { $in: adminIds } })
      .select("_id productName")
      .lean();

    res.status(200).json({ success: true, products });
  } catch (err) {
    console.error("Error fetching admin-created products:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default adminProductList;
