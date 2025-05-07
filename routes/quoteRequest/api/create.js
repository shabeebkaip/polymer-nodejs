import express from "express";
import QuoteRequest from "../../../models/quoteRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const createQuote = express.Router();

createQuote.post("/", authenticateUser, async (req, res) => {
  try {
    const quoteRequest = new QuoteRequest({
      ...req.body,
      user: req.user.id,
    });

    const savedRequest = await quoteRequest.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    console.error("Error saving quote request:", err);
    res.status(400).json({ error: err.message });
  }
});

export default createQuote;
