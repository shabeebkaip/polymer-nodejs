// import express from "express";
// import { authenticateUser } from "../../../middlewares/verify.token.js";
// import Finance from "../../../models/finance.js";

// const getUserFinance = express.Router();

// getUserFinance.get("/", authenticateUser, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const total = await Finance.countDocuments({ userId });

//     const userRequests = await Finance.find({ userId })
//       .populate({ path: "productId", select: "productName" })
//       .skip(skip)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       data: userRequests,
//       total,
//       page,
//       totalPages: Math.ceil(total / limit),
//       count: userRequests.length,
//     });
//   } catch (err) {
//     console.error("Error fetching user finance requests:", err);
//     res.status(500).json({ error: "Failed to fetch user finance requests" });
//   }
// });

// export default getUserFinance;


import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import Finance from "../../../models/finance.js";

const getUserFinance = express.Router();

getUserFinance.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Finance.countDocuments({ userId });

    const userRequests = await Finance.find({ userId })
      .populate({ path: "productId", select: "productName" })
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
    console.error("Error fetching user finance requests:", err);
    res.status(500).json({ error: "Failed to fetch user finance requests" });
  }
});

export default getUserFinance;