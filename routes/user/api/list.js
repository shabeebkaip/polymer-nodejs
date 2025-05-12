import express from "express";
import User from "../../../models/user.js";

const userList = express.Router();

userList.get("/", async (req, res) => {
  const { type, page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  const baseFilter = {};

  const filter = type
    ? { ...baseFilter, user_type: type }
    : baseFilter;

  try {
    const users = await User.find(filter)
      .sort({ _id: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const total = await User.countDocuments(filter);

    const modifiedUsers = users.map(user => ({
      ...user.toObject(),
      name: `${user.firstName} ${user.lastName}`
    }));

    res.status(200).json({
      success: true,
      data: modifiedUsers,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

export default userList;
