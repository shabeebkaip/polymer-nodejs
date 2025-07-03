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
      // First, find products that match the search term
      const matchingProducts = await Product.find({
        createdBy: sellerId,
        $or: [
          { productName: { $regex: search, $options: "i" } },
          { chemicalName: { $regex: search, $options: "i" } },
          { tradeName: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      
      const searchProductIds = matchingProducts.map(p => p._id);
      
      searchQuery.$or = [
        { product: { $in: searchProductIds } }, // Search by product name
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


recivedRouter.get("/:id", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    // Find all products owned by this seller
    const sellerProducts = await Product.find({ createdBy: sellerId }).select("_id");
    const productIds = sellerProducts.map(p => p._id.toString());

    // Find the sample request and ensure it is for a product owned by this seller
    const sampleRequest = await SampleRequest.findById(id)
      .populate({
        path: "product",
        select: "productName chemicalName description tradeName productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName email phone company address city state country",
        }
      })
      .populate({
        path: "grade",
        select: "name description",
      })
      .populate({
        path: "user",
        select: "firstName lastName email phone company address city state country pincode userType",
      });

    if (!sampleRequest || !productIds.includes(sampleRequest.product._id.toString())) {
      return res.status(404).json({
        success: false,
        message: "Sample request not found or you do not have access to this request",
        error: {
          code: "NOT_FOUND",
          details: "No such sample request for your products"
        }
      });
    }

    // Format user name
    const reqObj = sampleRequest.toObject();
    if (reqObj.user) {
      reqObj.user.name = `${reqObj.user.firstName} ${reqObj.user.lastName}`.trim();
      delete reqObj.user.firstName;
      delete reqObj.user.lastName;
    }

    res.status(200).json({
      success: true,
      message: "Sample request detail retrieved successfully",
      data: reqObj
    });
  } catch (err) {
    console.error("Error fetching sample request detail for seller:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sample request detail for seller",
      error: {
        code: "FETCH_ERROR",
        details: err.message
      }
    });
  }
});

export default recivedRouter;
