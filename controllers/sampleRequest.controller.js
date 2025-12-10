import sampleRequestService from "../services/sampleRequest.service.js";

class SampleRequestController {
  /**
   * Create a new sample request
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

      const sampleRequest = await sampleRequestService.createSampleRequest({
        user: userId,
        product,
        ...requestData,
      });

      res.status(201).json({
        success: true,
        message: "Sample request created successfully",
        data: sampleRequest,
      });
    } catch (error) {
      console.error("Error creating sample request:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create sample request",
      });
    }
  }

  /**
   * Get sample requests for buyer
   */
  async getBuyerRequests(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await sampleRequestService.getBuyerSampleRequests(
        userId,
        filters
      );

      // Format response
      const formattedRequests = result.sampleRequests.map((request) => {
        const seller = request.product?.createdBy;
        const product = request.product;

        return {
          _id: request._id,
          status: request.status,
          quantity: request.quantity,
          sampleSize: request.sampleSize,
          uom: request.uom,
          message: request.message,
          application: request.application,
          expectedAnnualVolume: request.expected_annual_volume,
          address: request.address,
          country: request.country,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          seller: seller
            ? {
                _id: seller._id,
                name: `${seller.firstName} ${seller.lastName}`.trim(),
                email: seller.email,
                phone: seller.phone,
                company: seller.company,
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
          grade: request.grade
            ? {
                _id: request.grade._id,
                name: request.grade.name,
              }
            : null,
        };
      });

      res.status(200).json({
        success: true,
        message: "Sample requests retrieved successfully",
        data: formattedRequests,
        meta: {
          pagination: result.pagination,
          statusSummary: result.statusSummary,
        },
      });
    } catch (error) {
      console.error("Error fetching buyer sample requests:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch sample requests",
      });
    }
  }

  /**
   * Get sample requests for seller
   */
  async getSellerRequests(req, res) {
    try {
      const sellerId = req.user.id;
      const filters = req.query;

      const result = await sampleRequestService.getSellerSampleRequests(
        sellerId,
        filters
      );

      // Format response
      const formattedRequests = result.sampleRequests.map((request) => {
        const buyer = request.user;
        const product = request.product;

        return {
          _id: request._id,
          status: request.status,
          quantity: request.quantity,
          sampleSize: request.sampleSize,
          uom: request.uom,
          message: request.message,
          application: request.application,
          expectedAnnualVolume: request.expected_annual_volume,
          address: request.address,
          country: request.country,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          buyer: buyer
            ? {
                _id: buyer._id,
                name: `${buyer.firstName} ${buyer.lastName}`.trim(),
                email: buyer.email,
                phone: buyer.phone,
                company: buyer.company,
                location: `${buyer.city || ""}, ${buyer.country || ""}`.trim(),
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
          grade: request.grade
            ? {
                _id: request.grade._id,
                name: request.grade.name,
              }
            : null,
        };
      });

      res.status(200).json({
        success: true,
        message: "Sample requests retrieved successfully",
        data: formattedRequests,
        meta: {
          pagination: result.pagination,
          statusSummary: result.statusSummary,
        },
      });
    } catch (error) {
      console.error("Error fetching seller sample requests:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch sample requests",
      });
    }
  }

  /**
   * Get single sample request by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.user_type || "user";

      const sampleRequest = await sampleRequestService.getSampleRequestById(
        id,
        userId,
        userRole
      );

      const buyer = sampleRequest.user;
      const seller = sampleRequest.product?.createdBy;
      const product = sampleRequest.product;

      const formattedResponse = {
        _id: sampleRequest._id,
        status: sampleRequest.status,
        quantity: sampleRequest.quantity,
        sampleSize: sampleRequest.sampleSize,
        uom: sampleRequest.uom,
        address: sampleRequest.address,
        country: sampleRequest.country,
        message: sampleRequest.message,
        application: sampleRequest.application,
        expectedAnnualVolume: sampleRequest.expected_annual_volume,
        orderDate: sampleRequest.orderDate,
        neededBy: sampleRequest.neededBy,
        requestDocument: sampleRequest.request_document,
        createdAt: sampleRequest.createdAt,
        updatedAt: sampleRequest.updatedAt,
        buyer: buyer
          ? {
              _id: buyer._id,
              name: `${buyer.firstName} ${buyer.lastName}`.trim(),
              email: buyer.email,
              phone: buyer.phone,
              company: buyer.company,
              address: buyer.address,
              city: buyer.city,
              state: buyer.state,
              country: buyer.country,
              pincode: buyer.pincode,
            }
          : null,
        seller: seller
          ? {
              _id: seller._id,
              name: `${seller.firstName} ${seller.lastName}`.trim(),
              email: seller.email,
              phone: seller.phone,
              company: seller.company,
              address: seller.address,
              city: seller.city,
              state: seller.state,
              country: seller.country,
            }
          : null,
        product: product
          ? {
              _id: product._id,
              productName: product.productName,
              chemicalName: product.chemicalName,
              tradeName: product.tradeName,
              description: product.description,
              productImages: product.productImages || [],
              countryOfOrigin: product.countryOfOrigin,
              color: product.color,
              density: product.density,
              mfi: product.mfi,
              tensileStrength: product.tensileStrength,
              elongationAtBreak: product.elongationAtBreak,
              shoreHardness: product.shoreHardness,
              waterAbsorption: product.waterAbsorption,
              manufacturingMethod: product.manufacturingMethod,
            }
          : null,
        grade: sampleRequest.grade
          ? {
              _id: sampleRequest.grade._id,
              name: sampleRequest.grade.name,
              description: sampleRequest.grade.description,
            }
          : null,
      };

      res.status(200).json({
        success: true,
        message: "Sample request detail retrieved successfully",
        data: formattedResponse,
      });
    } catch (error) {
      console.error("Error fetching sample request detail:", error);
      const status = error.message.includes("not found")
        ? 404
        : error.message.includes("not have access")
        ? 403
        : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to fetch sample request detail",
      });
    }
  }

  /**
   * Update sample request status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const userRole = req.user.user_type || "user";

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const allowedStatuses = [
        "pending",
        "responded",
        "sent",
        "delivered",
        "approved",
        "rejected",
        "cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      const sampleRequest =
        await sampleRequestService.updateSampleRequestStatus(
          id,
          status,
          userId,
          userRole
        );

      res.status(200).json({
        success: true,
        message: "Sample request status updated successfully",
        data: sampleRequest,
      });
    } catch (error) {
      console.error("Error updating sample request status:", error);
      const status = error.message.includes("not authorized") ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to update sample request status",
      });
    }
  }

  /**
   * Delete sample request
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.user_type || "user";

      await sampleRequestService.deleteSampleRequest(id, userId, userRole);

      res.status(200).json({
        success: true,
        message: "Sample request deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting sample request:", error);
      const status = error.message.includes("not authorized") ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to delete sample request",
      });
    }
  }

  /**
   * Get sample requests by product ID (for sellers)
   */
  async getByProductId(req, res) {
    try {
      const { productId } = req.params;
      const sellerId = req.user.id;

      const sampleRequests =
        await sampleRequestService.getSampleRequestsByProductId(
          productId,
          sellerId
        );

      // Format response
      const formattedRequests = sampleRequests.map((request) => {
        const buyer = request.user;
        const product = request.product;

        return {
          _id: request._id,
          status: request.status,
          quantity: request.quantity,
          sampleSize: request.sampleSize,
          uom: request.uom,
          message: request.message,
          application: request.application,
          expectedAnnualVolume: request.expected_annual_volume,
          address: request.address,
          country: request.country,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          buyer: buyer
            ? {
                _id: buyer._id,
                name: `${buyer.firstName} ${buyer.lastName}`.trim(),
                email: buyer.email,
                phone: buyer.phone,
                company: buyer.company,
                location: `${buyer.city || ""}, ${buyer.country || ""}`.trim(),
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
          grade: request.grade
            ? {
                _id: request.grade._id,
                name: request.grade.name,
              }
            : null,
        };
      });

      res.status(200).json({
        success: true,
        message: "Sample requests retrieved successfully",
        data: formattedRequests,
        meta: {
          total: formattedRequests.length,
          productId: productId,
        },
      });
    } catch (error) {
      console.error("Error fetching sample requests by product ID:", error);
      const status = error.message.includes("not found")
        ? 404
        : error.message.includes("not have access")
        ? 403
        : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to fetch sample requests",
      });
    }
  }
}

export default new SampleRequestController();
