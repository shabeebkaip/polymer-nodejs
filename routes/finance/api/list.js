import express from "express";
import Finance from "../../../models/finance.js";

const financeListRouter = express.Router();

financeListRouter.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalRequests = await Finance.countDocuments();

    const requests = await Finance.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({ path: "productId", select: "productName" })
      .populate({ path: "userId", select: "firstName lastName company email" }) 

            
      const updatedRequests = requests.map(request => {
        const reqObj = request.toObject(); 
        if (reqObj.userId) {
          reqObj.userId.name = `${reqObj.userId.firstName} ${reqObj.userId.lastName}`.trim();
          delete reqObj.userId.firstName;
          delete reqObj.userId.lastName;
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
    console.error("Error fetching finance requests:", err);
    res.status(500).json({ error: "Failed to fetch finance requests" });
  }
});

export default financeListRouter;
