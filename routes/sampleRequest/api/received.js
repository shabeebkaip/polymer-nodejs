import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";
import Product from "../../../models/product.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const recivedRouter = express.Router();

recivedRouter.get("/", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const skip = (page - 1) * limit;

    const sellerProducts = await Product.find({ createdBy: sellerId }).select("_id");
    const productIds = sellerProducts.map(p => p._id);

    // Build search query
    let searchQuery = { product: { $in: productIds } };
    if (search) {
      searchQuery.$or = [
        { remarks: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { pincode: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } }
      ];
    }
    if (status) {
      searchQuery.status = status;
    }

    const total = await SampleRequest.countDocuments(searchQuery);
    const requests = await SampleRequest.find(searchQuery)
      .populate({ path: "product", select: "productName" })
      .populate({ path: "grade", select: "name" })
      .populate({ path: "user", select: "firstName lastName company email" })
      .skip(skip)
      .limit(limit)
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
      success: true,
      message: "Sample requests for seller's products retrieved successfully",
      data: updatedRequests,
      meta: {
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          count: updatedRequests.length,
          limit
        },
        filters: {
          search,
          status
        }
      }
    });
  } catch (err) {
    console.error("Error fetching requests for seller's products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sample requests for seller's products",
      error: {
        code: "FETCH_ERROR",
        details: err.message
      }
    });
  }
});

export default recivedRouter;
