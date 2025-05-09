import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";
import Product from "../../../models/product.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const recivedRouter = express.Router();

recivedRouter.get("/", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id; 

    const sellerProducts = await Product.find({ createdBy: sellerId }).select("_id");
    const productIds = sellerProducts.map(p => p._id);

    const requests = await SampleRequest.find({ product: { $in: productIds } })
      .populate({ path: "product", select: "productName" })
      .populate({ path: "grade", select: "name" })
      .populate({ path: "user", select: "firstName lastName company email" })
      .sort({ createdAt: -1 });

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
      total: updatedRequests.length,
      data: updatedRequests,
    });
  } catch (err) {
    console.error("Error fetching requests for seller's products:", err);
    res.status(500).json({ error: "Failed to fetch sample requests" });
  }
});

export default recivedRouter;
