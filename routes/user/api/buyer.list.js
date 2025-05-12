import express from "express";
import User from "../../../models/user.js";

const buyerList = express.Router();

buyerList.get("/list", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  const filter = {
    user_type: "buyer",
    // verification: "approved"
  };

  try {
    const users = await User.find(filter)
      .sort({ _id: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

export default buyerList;
