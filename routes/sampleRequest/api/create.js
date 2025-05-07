import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const createSample = express.Router();

createSample.post("/", authenticateUser, async (req, res) => {
  try {
    const sampleRequest = new SampleRequest({
      ...req.body,
      user: req.user.id, 
    });

    const savedRequest = await sampleRequest.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    console.error("Error saving sample request:", err);
    res.status(400).json({ error: err.message });
  }
});

export default createSample;
