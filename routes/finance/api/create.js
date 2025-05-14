import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import Finance from "../../../models/finance.js";

const financeRequestRouter = express.Router();

financeRequestRouter.post("/", authenticateUser, async (req, res) => {
  try {
    const financeRequest = new Finance({
      ...req.body,
      userId: req.user.id,
    });

    const savedRequest = await financeRequest.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    console.error("Error saving finance request:", err);
    res.status(400).json({ error: err.message });
  }
});

export default financeRequestRouter;
