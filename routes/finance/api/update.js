import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import Finance from "../../../models/finance.js";

const updateFinanceRouter = express.Router();

updateFinanceRouter.put("/:id", authenticateUser, async (req, res) => {
  try {
    const financeId = req.params.id;
    const userId = req.user.id;

    const financeRequest = await Finance.findOne({ _id: financeId, userId });

    if (!financeRequest) {
      return res.status(404).json({ error: "Finance request not found or unauthorized" });
    }

    const {
      productId,
      emiMonths,
      quantity,
      estimatedPrice,
      notes,
      status
    } = req.body;

    if (!productId || !emiMonths || !quantity || !estimatedPrice || !notes) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    financeRequest.productId = productId;
    financeRequest.emiMonths = emiMonths;
    financeRequest.quantity = quantity;
    financeRequest.estimatedPrice = estimatedPrice;
    financeRequest.notes = notes;
    financeRequest.status = status || financeRequest.status; 

    const updatedFinance = await financeRequest.save();

    res.status(200).json({ success: true, data: updatedFinance });
  } catch (err) {
    console.error("Error updating finance request:", err);
    res.status(500).json({ error: "Failed to update finance request" });
  }
});

export default updateFinanceRouter;
