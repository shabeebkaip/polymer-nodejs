import sampleRequestRepository from "../repositories/sampleRequest.repository.js";
import Product from "../models/product.js";
import notificationService from "./notification.service.js";
import mongoose from "mongoose";

class SampleRequestService {
  /**
   * Create a new sample request
   */
  async createSampleRequest(data) {
    const { product: productId, user: userId } = data;

    // Validate product exists and get seller info
    const product = await Product.findById(productId)
      .populate("createdBy", "_id firstName lastName email company")
      .select("productName createdBy");

    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.createdBy || !product.createdBy._id) {
      throw new Error("Product owner (seller) not found");
    }

    // Create the sample request
    const sampleRequest = await sampleRequestRepository.create({
      ...data,
      status: "pending",
    });

    // Send notification to seller
    try {
      await notificationService.notifySellerNewSampleRequest({
        seller: product.createdBy,
        buyerId: userId,
        product,
        request: sampleRequest,
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
      // Don't fail the request creation if notification fails
    }

    // Return populated request
    return await sampleRequestRepository.findById(sampleRequest._id, [
      {
        path: "product",
        select: "productName chemicalName tradeName productImages",
      },
      {
        path: "grade",
        select: "name",
      },
    ]);
  }

  /**
   * Get all sample requests for admin with filters and pagination
   */
  async getAdminSampleRequests(filters) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
      userType, // 'buyer' or 'seller'
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Enhanced search functionality
    if (search) {
      // Search in products
      const matchingProducts = await Product.find({
        $or: [
          { productName: { $regex: search, $options: "i" } },
          { chemicalName: { $regex: search, $options: "i" } },
          { tradeName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const productIds = matchingProducts.map((p) => p._id);

      filter.$or = [
        { message: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { application: { $regex: search, $options: "i" } },
      ];

      // Add product match if found
      if (productIds.length > 0) {
        filter.$or.push({ product: { $in: productIds } });
      }
    }

    // Populate config
    const populate = [
      {
        path: "user",
        select: "firstName lastName company email phone user_type address location country_code",
      },
      {
        path: "product",
        select: "productName chemicalName tradeName productImages createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName company email phone address location website country_code vat_number",
        },
      },
      {
        path: "grade",
        select: "name",
      },
    ];

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // Fetch data
    const [sampleRequests, total, statusSummary] = await Promise.all([
      sampleRequestRepository.findWithFilters({
        filter,
        sort,
        skip,
        limit: parseInt(limit),
        populate,
      }),
      sampleRequestRepository.count(filter),
      sampleRequestRepository.getStatusSummaryForAdmin(),
    ]);

    return {
      sampleRequests,
      total,
      statusSummary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  /**
   * Get sample requests for buyer with filters and pagination
   */
  async getBuyerSampleRequests(userId, filters) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { user: new mongoose.Types.ObjectId(userId) };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { application: { $regex: search, $options: "i" } },
      ];
    }

    // Populate config
    const populate = [
      {
        path: "product",
        select: "productName chemicalName tradeName productImages createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName company email phone",
        },
      },
      {
        path: "grade",
        select: "name",
      },
    ];

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // Fetch data
    const [sampleRequests, total, statusSummary] = await Promise.all([
      sampleRequestRepository.findWithFilters({
        filter,
        sort,
        skip,
        limit: parseInt(limit),
        populate,
      }),
      sampleRequestRepository.count(filter),
      sampleRequestRepository.getStatusSummaryForBuyer(
        new mongoose.Types.ObjectId(userId)
      ),
    ]);

    return {
      sampleRequests,
      total,
      statusSummary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  /**
   * Get sample requests for seller's products with filters and pagination
   */
  async getSellerSampleRequests(sellerId, filters) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get seller's products
    const sellerProducts = await Product.find({ createdBy: sellerId }).select(
      "_id"
    );
    const productIds = sellerProducts.map((p) => p._id);

    if (productIds.length === 0) {
      return {
        sampleRequests: [],
        total: 0,
        statusSummary: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit),
        },
      };
    }

    // Build filter
    const filter = { product: { $in: productIds } };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      // Search in product names
      const matchingProducts = await Product.find({
        createdBy: sellerId,
        $or: [
          { productName: { $regex: search, $options: "i" } },
          { chemicalName: { $regex: search, $options: "i" } },
          { tradeName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const searchProductIds = matchingProducts.map((p) => p._id);

      filter.$or = [
        { product: { $in: searchProductIds } },
        { message: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { application: { $regex: search, $options: "i" } },
      ];
    }

    // Populate config
    const populate = [
      {
        path: "product",
        select: "productName chemicalName tradeName productImages",
      },
      {
        path: "grade",
        select: "name",
      },
      {
        path: "user",
        select: "firstName lastName company email phone address city state country",
      },
    ];

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // Fetch data
    const [sampleRequests, total, statusSummary] = await Promise.all([
      sampleRequestRepository.findWithFilters({
        filter,
        sort,
        skip,
        limit: parseInt(limit),
        populate,
      }),
      sampleRequestRepository.count(filter),
      sampleRequestRepository.getStatusSummaryForSeller(productIds),
    ]);

    return {
      sampleRequests,
      total,
      statusSummary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  /**
   * Get single sample request by ID
   */
  async getSampleRequestById(id, userId, userRole) {
    const populate = [
      {
        path: "user",
        select:
          "firstName lastName email phone company address city state country pincode",
      },
      {
        path: "product",
        select:
          "productName chemicalName tradeName description productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName email phone company address city state country",
        },
      },
      {
        path: "grade",
        select: "name description",
      },
    ];

    const sampleRequest = await sampleRequestRepository.findById(id, populate);

    if (!sampleRequest) {
      throw new Error("Sample request not found");
    }

    // Check access rights
    if (userRole !== "admin") {
      const userIdString = userId.toString();
      const buyerIdString = sampleRequest.user._id.toString();
      const sellerIdString = sampleRequest.product.createdBy._id.toString();

      const hasAccess =
        buyerIdString === userIdString || sellerIdString === userIdString;

      if (!hasAccess) {
        throw new Error("You do not have access to this sample request");
      }
    }

    return sampleRequest;
  }

  /**
   * Update sample request status
   */
  async updateSampleRequestStatus(id, status, userId, userRole) {
    const sampleRequest = await sampleRequestRepository.findById(id, [
      { path: "user", select: "firstName lastName email company" },
      {
        path: "product",
        select: "productName createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName email company",
        },
      },
    ]);

    if (!sampleRequest) {
      throw new Error("Sample request not found");
    }

    // Check authorization - only seller or admin can update status
    if (userRole !== "admin") {
      const sellerIdString = sampleRequest.product.createdBy._id.toString();
      if (sellerIdString !== userId.toString()) {
        throw new Error("You are not authorized to update this request status");
      }
    }

    const oldStatus = sampleRequest.status;

    // Update status
    const updatedRequest = await sampleRequestRepository.updateStatus(
      id,
      status
    );

    // Send notification to buyer
    if (status !== oldStatus) {
      try {
        await notificationService.notifySampleStatusUpdate({
          buyer: sampleRequest.user,
          seller: sampleRequest.product.createdBy,
          product: sampleRequest.product,
          request: updatedRequest,
          oldStatus,
          newStatus: status,
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
        // Don't fail the status update if notification fails
      }
    }

    return updatedRequest;
  }

  /**
   * Delete sample request
   */
  async deleteSampleRequest(id, userId, userRole) {
    const sampleRequest = await sampleRequestRepository.findById(id);

    if (!sampleRequest) {
      throw new Error("Sample request not found");
    }

    // Only buyer or admin can delete
    if (userRole !== "admin" && sampleRequest.user.toString() !== userId) {
      throw new Error("You are not authorized to delete this request");
    }

    return await sampleRequestRepository.delete(id);
  }

  /**
   * Get sample requests by product ID (for sellers)
   */
  async getSampleRequestsByProductId(productId, sellerId) {
    try {
      // Verify the product belongs to this seller
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error("Product not found");
      }

      const productSellerId = product.createdBy?.toString();
      const sellerIdString = sellerId?.toString();

      if (productSellerId !== sellerIdString) {
        throw new Error("You do not have access to this product's requests");
      }

      // Fetch all sample requests for this product
      const sampleRequests = await sampleRequestRepository.findWithFilters({
        filter: { product: productId },
        sort: { createdAt: -1 },
        skip: 0,
        limit: 1000,
        populate: [
          {
            path: "user",
            select:
              "firstName lastName email phone company address city state country",
          },
          {
            path: "product",
            select: "productName chemicalName tradeName productImages",
          },
          {
            path: "grade",
            select: "name",
          },
        ],
      });

      return sampleRequests;
    } catch (error) {
      console.error("Error in getSampleRequestsByProductId service:", error);
      throw error;
    }
  }
}

export default new SampleRequestService();
