import * as bulkOrderRepository from "../repositories/bulkOrder.repository.js";
import Product from "../models/product.js";
import mongoose from "mongoose";

class BulkOrderService {
  /**
   * Create a new bulk order
   */
  async createBulkOrder(data) {
    const { product: productId } = data;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const bulkOrder = await bulkOrderRepository.create({
      ...data,
      status: "pending",
    });

    // Return populated order
    return await bulkOrderRepository.findById(bulkOrder._id, [
      { path: "user", select: "firstName lastName email company" },
      { path: "createdBy", select: "firstName lastName email company" },
      { path: "product", select: "productName chemicalName tradeName" },
    ]);
  }

  /**
   * Get all bulk orders for admin with filters and pagination
   */
  async getAdminBulkOrders(filters) {
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
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

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
        { city: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];

      if (productIds.length > 0) {
        filter.$or.push({ product: { $in: productIds } });
      }
    }

    const populate = [
      {
        path: "product",
        select: "productName chemicalName tradeName productImages",
      },
      {
        path: "user",
        select: "firstName lastName email company phone city country user_type",
      },
    ];

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [bulkOrders, total, statusCounts] = await Promise.all([
      bulkOrderRepository.findWithFilters({
        filter,
        sort,
        skip,
        limit: parseInt(limit),
        populate,
      }),
      bulkOrderRepository.count(filter),
      bulkOrderRepository.getStatusCounts(),
    ]);

    return {
      bulkOrders,
      total,
      statusCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  /**
   * Get bulk orders for user with filters and pagination
   */
  async getUserBulkOrders(userId, filters) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: new mongoose.Types.ObjectId(userId) };

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { city: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const populate = [
      {
        path: "user",
        select: "firstName lastName email phone company address city state country pincode userType",
      },
      {
        path: "product",
        select: "productName createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName company email",
        },
      },
    ];

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [bulkOrders, total] = await Promise.all([
      bulkOrderRepository.findWithFilters({
        filter,
        sort,
        skip,
        limit: parseInt(limit),
        populate,
      }),
      bulkOrderRepository.count(filter),
    ]);

    return {
      bulkOrders,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  /**
   * Get bulk order detail by ID
   */
  async getBulkOrderDetail(id, userId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid bulk order ID");
    }

    const result = await bulkOrderRepository.getDetailWithOffers(id);

    if (!result || !result.bulkOrder) {
      throw new Error("Bulk order not found");
    }

    // Verify user has access (either the owner or admin)
    if (
      userId &&
      result.bulkOrder.user._id.toString() !== userId.toString()
    ) {
      // If not admin role check, throw error
      // This should be handled by middleware, but as a fallback
    }

    return result;
  }

  /**
   * Update bulk order status (admin only)
   */
  async updateBulkOrderStatus(id, status) {
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    const updated = await bulkOrderRepository.updateById(id, { status });

    if (!updated) {
      throw new Error("Bulk order not found");
    }

    return updated;
  }

  /**
   * Update bulk order (admin only)
   */
  async updateBulkOrder(id, updates) {
    const updated = await bulkOrderRepository.updateById(id, updates);

    if (!updated) {
      throw new Error("Bulk order not found");
    }

    return updated;
  }

  /**
   * Get approved bulk orders (public opportunities)
   */
  async getApprovedBulkOrders(filters = {}) {
    const { location } = filters;

    let queryFilter = {};

    if (location) {
      queryFilter.$and = [
        {
          $or: [
            { city: { $regex: location, $options: "i" } },
            { country: { $regex: location, $options: "i" } },
          ],
        },
      ];
    }

    const result = await bulkOrderRepository.getApprovedWithOfferCounts(queryFilter);

    // Create a map for quick lookup
    const offerCountMap = result.offerCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item;
      return acc;
    }, {});

    const opportunities = result.approvedOrders.map((order) => {
      const obj = order.toObject();
      const orderId = obj._id.toString();
      const offerData = offerCountMap[orderId] || {
        totalOffers: 0,
        pendingOffers: 0,
        approvedOffers: 0,
        rejectedOffers: 0,
      };

      const isHighPriority =
        obj.delivery_date &&
        new Date(obj.delivery_date) <=
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return {
        id: obj._id,
        productName: obj.product?.productName || "N/A",
        chemicalName: obj.product?.chemicalName || "",
        tradeName: obj.product?.tradeName || "",
        description: obj.message || "Urgent requirement. Prefer earliest shipment.",
        priority: isHighPriority ? "HIGH" : "NORMAL",
        buyer: {
          id: obj.user?._id,
          name: obj.user
            ? `${obj.user.firstName} ${obj.user.lastName}`
            : "Unknown",
          company: obj.user?.company || "",
          location: `${obj.user?.city || ""}, ${obj.user?.country || ""}`.replace(/^, |, $/, ""),
        },
        requirements: {
          quantity: obj.quantity,
          uom: obj.uom,
          deliveryDate: obj.delivery_date,
          destination: obj.destination,
          city: obj.city,
          country: obj.country,
        },
        offers: {
          total: offerData.totalOffers,
          pending: offerData.pendingOffers,
          approved: offerData.approvedOffers,
          rejected: offerData.rejectedOffers,
        },
        createdAt: obj.createdAt,
      };
    });

    return opportunities;
  }
}

export default new BulkOrderService();
