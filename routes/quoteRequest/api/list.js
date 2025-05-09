import express from "express";
import QuoteRequest from "../../../models/quoteRequest.js";


const getAllQuotesRequests = express.Router();

getAllQuotesRequests.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalRequests = await QuoteRequest.countDocuments();

        const requests = await QuoteRequest.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate({ path: "product", select: "productName" })
            .populate({ path: "grade", select: "name" })
            .populate({ path: "incoterm", select: "name" })
            .populate({ path: "packagingType", select: "name" })   
            .populate({ path: "user", select: "firstName lastName company email" }) 

            
      const updatedRequests = requests.map(request => {
        const reqObj = request.toObject(); 
        if (reqObj.user) {
          reqObj.user.name = `${reqObj.user.firstName} ${reqObj.user.lastName}`.trim();
          delete reqObj.user.firstName;
          delete reqObj.user.lastName;
        }
  
        return reqObj;
      });
            
        res.status(200).json({
            success: true,
            data: updatedRequests,
            total: totalRequests,
            page,
            totalPages: Math.ceil(totalRequests / limit),
        });
    } catch (err) {
        console.error("Error fetching all Quote requests:", err);
        res.status(500).json({ error: "Failed to fetch Quote requests" });
    }
});

export default getAllQuotesRequests;
