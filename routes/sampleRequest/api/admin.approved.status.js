import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";

const getApprovedSamples = express.Router();

getApprovedSamples.get("/", async (req, res) => {
  try {
    const approvedSamples = await SampleRequest.find({ status: "approved" })
      .populate("product", "productName")
      .populate("user", "firstName lastName company")
      .sort({ createdAt: -1 });

    const formatted = approvedSamples.map((sample) => {
      const obj = sample.toObject();
      if (obj.user) {
        obj.user.name = `${obj.user.firstName} ${obj.user.lastName}`;
        delete obj.user.firstName;
        delete obj.user.lastName;
      }
      return obj;
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error("Approved sample request fetch error:", err);
    res.status(500).json({ error: "Failed to fetch approved sample requests" });
  }
});

export default getApprovedSamples;
