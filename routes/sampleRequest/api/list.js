import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";

const getAllSampleRequests = express.Router();

getAllSampleRequests.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalRequests = await SampleRequest.countDocuments();

        const requests = await SampleRequest.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate({ path: "product", select: "productName" })
            .populate({ path: "grade", select: "name" })
            .populate({ path: "user", select: "firstName lastName company" }) 
            
        res.status(200).json({
            success: true,
            data: requests,
            total: totalRequests,
            page,
            totalPages: Math.ceil(totalRequests / limit),
        });
    } catch (err) {
        console.error("Error fetching all sample requests:", err);
        res.status(500).json({ error: "Failed to fetch sample requests" });
    }
});

export default getAllSampleRequests;
