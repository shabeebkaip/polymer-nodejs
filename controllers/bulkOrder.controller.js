import bulkOrderService from "../services/bulkOrder.service.js";

class BulkOrderController {
  /**
   * Create a new bulk order
   */
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { product, ...requestData } = req.body;

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }

      const bulkOrder = await bulkOrderService.createBulkOrder({
        user: userId,
        createdBy: userId,
        product,
        ...requestData,
      });

      res.status(201).json({
        success: true,
        message: "Bulk order created successfully",
        data: bulkOrder,
      });
    } catch (error) {
      console.error("Error creating bulk order:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create bulk order",
      });
    }
  }

  /**
   * Get all bulk orders for admin
   */
  async getAdminOrders(req, res) {
    try {
      const filters = req.query;

      const result = await bulkOrderService.getAdminBulkOrders(filters);

      // Format response
      const formattedOrders = result.bulkOrders.map((order) => {
        const user = order.user;
        const product = order.product;

        return {
          _id: order._id,
          status: order.status,
          quantity: order.quantity,
          uom: order.uom,
          city: order.city,
          country: order.country,
          destination: order.destination,
          deliveryDate: order.delivery_date,
          message: order.message,
          requestDocument: order.request_document,
          sellerStatus: order.sellerStatus,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          buyer: user
            ? {
                _id: user._id,
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                phone: user.phone,
                company: user.company,
                userType: user.user_type,
                location: `${user.city || ""}, ${user.country || ""}`.trim(),
              }
            : null,
          product: product
            ? {
                _id: product._id,
                productName: product.productName,
                chemicalName: product.chemicalName,
                tradeName: product.tradeName,
                productImage: product.productImages?.[0]?.fileUrl || null,
              }
            : null,
        };
      });

      res.status(200).json({
        success: true,
        message: "Bulk orders retrieved successfully",
        data: formattedOrders,
        meta: {
          pagination: result.pagination,
        },
      });
    } catch (error) {
      console.error("Error fetching admin bulk orders:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch bulk orders",
      });
    }
  }

  /**
   * Get bulk orders for user
   */
  async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await bulkOrderService.getUserBulkOrders(userId, filters);

      // Format response
      const formattedOrders = result.bulkOrders.map((order) => {
        const orderObj = order.toObject();
        return {
          ...orderObj,
          statusTracking: {
            adminStatus: orderObj.status,
            sellerStatus: orderObj.sellerStatus,
            lastUpdate:
              orderObj.statusMessage && orderObj.statusMessage.length > 0
                ? orderObj.statusMessage[orderObj.statusMessage.length - 1].date
                : orderObj.updatedAt,
            totalUpdates: orderObj.statusMessage?.length || 0,
          },
        };
      });

      res.status(200).json({
        success: true,
        message: "Bulk orders retrieved successfully",
        data: formattedOrders,
        meta: {
          pagination: result.pagination,
          filters: {
            search: filters.search,
            status: filters.status,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching user bulk orders:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch bulk orders",
        error: {
          code: "FETCH_ERROR",
          details: error.message,
        },
      });
    }
  }

  /**
   * Get bulk order detail by ID
   */
  async getOrderDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const result = await bulkOrderService.getBulkOrderDetail(id, userId);

      const orderObj = result.bulkOrder.toObject();
      const formattedOrder = {
        ...orderObj,
        statusTracking: {
          adminStatus: orderObj.status,
          sellerStatus: orderObj.sellerStatus,
          lastUpdate:
            orderObj.statusMessage && orderObj.statusMessage.length > 0
              ? orderObj.statusMessage[orderObj.statusMessage.length - 1].date
              : orderObj.updatedAt,
          totalUpdates: orderObj.statusMessage?.length || 0,
        },
        offers: result.offers,
      };

      res.status(200).json({
        success: true,
        data: formattedOrder,
      });
    } catch (error) {
      console.error("Error fetching bulk order detail:", error);
      const statusCode = error.message.includes("Invalid") ? 400 : 404;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: {
          code: error.message.includes("Invalid") ? "INVALID_ID" : "NOT_FOUND",
          details: error.message,
        },
      });
    }
  }

  /**
   * Update bulk order status (admin only)
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await bulkOrderService.updateBulkOrderStatus(id, status);

      res.status(200).json({
        success: true,
        message: `Bulk order ${status} successfully`,
        data: updated,
      });
    } catch (error) {
      console.error("Error updating bulk order status:", error);
      const statusCode = error.message === "Bulk order not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to update bulk order status",
      });
    }
  }

  /**
   * Update bulk order (admin only)
   */
  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updated = await bulkOrderService.updateBulkOrder(id, updates);

      res.status(200).json({
        success: true,
        message: "Bulk order updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating bulk order:", error);
      res.status(error.message === "Bulk order not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update bulk order",
      });
    }
  }

  /**
   * Get approved bulk orders (public opportunities)
   */
  async getApprovedOrders(req, res) {
    try {
      const filters = req.query;

      const opportunities = await bulkOrderService.getApprovedBulkOrders(filters);

      res.status(200).json({
        success: true,
        data: opportunities,
        count: opportunities.length,
      });
    } catch (error) {
      console.error("Error fetching approved bulk orders:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch approved bulk orders",
      });
    }
  }
}

export default new BulkOrderController();
