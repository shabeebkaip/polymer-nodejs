// import express from "express";
// import { authenticateUser } from "../../../middlewares/verify.token.js";
// import Finance from "../../../models/finance.js";

// const financeRequestRouter = express.Router();

// financeRequestRouter.post("/", authenticateUser, async (req, res) => {
//   try {
//     const financeRequest = new Finance({
//       ...req.body,
//       userId: req.user.id,
//     });

//     const savedRequest = await financeRequest.save();
//     res.status(201).json(savedRequest);
//   } catch (err) {
//     console.error("Error saving finance request:", err);
//     res.status(400).json({ error: err.message });
//   }
// });

// export default financeRequestRouter; 

import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import Finance from "../../../models/finance.js";

const createFinance = express.Router();

createFinance.post("/", authenticateUser, async (req, res) => {
  try {
    const finance = new Finance({
      ...req.body,
      status: "pending",
      userId: req.user.id,
    });

    const saved = await finance.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Finance request creation error:", err);
    res.status(400).json({ error: err.message });
  }
});

export default createFinance;
