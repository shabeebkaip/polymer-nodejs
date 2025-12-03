import dealQuoteRequestService from "../services/dealQuoteRequest.service.js";

class DealQuoteRequestController {
  /**
   * Create a new deal quote request
   */
  async create(req, res) {
    try {
      const buyerId = req.user.id;
      const { bestDealId, ...requestData } = req.body;

      if (!bestDealId) {
        return res.status(400).json({
          success: false,
          message: "Best deal ID is required",
        });
      }

      const dealQuote = await dealQuoteRequestService.createDealQuoteRequest({
        buyerId,
        bestDealId,
        ...requestData,
      });

      res.status(201).json({
        success: true,
        message: "Deal quote request created successfully",
        data: dealQuote,
      });
    } catch (error) {
      console.error("Error creating deal quote:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create deal quote request",
      });
    }
  }

  /**
   * Get deal quotes for seller
   */
  async getSellerRequests(req, res) {
    try {
      const sellerId = req.user.id;
      const filters = req.query;

      const result = await dealQuoteRequestService.getSellerDealQuotes(
        sellerId,
        filters
      );

      // Format response
      const formattedQuotes = result.dealQuotes.map((quote) => {
        const buyer = quote.buyerId;
        const deal = quote.bestDealId;
        const product = deal?.productId;

        return {
          _id: quote._id,
          status: quote.currentStatus,
          message: quote.message,
          createdAt: quote.createdAt,
          updatedAt: quote.updatedAt,
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
          deal: deal
            ? {
                _id: deal._id,
                title: deal.title,
                description: deal.description,
                dealPrice: deal.dealPrice,
                productName: product?.productName || deal.title,
                productImage: product?.productImages?.[0]?.fileUrl || null,
              }
            : null,
          orderDetails: {
            quantity: quote.desiredQuantity,
            shippingCountry: quote.shippingCountry,
            paymentTerms: quote.paymentTerms,
            deliveryDeadline: quote.deliveryDeadline,
          },
          sellerResponse: quote.sellerResponse,
        };
      });

      res.status(200).json({
        success: true,
        message: "Deal quote requests retrieved successfully",
        data: formattedQuotes,
        meta: {
          pagination: result.pagination,
          statusSummary: result.statusSummary,
        },
      });
    } catch (error) {
      console.error("Error fetching seller deal quotes:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch deal quote requests",
      });
    }
  }

  /**
   * Get deal quotes for buyer
   */
  async getBuyerRequests(req, res) {
    try {
      const buyerId = req.user.id;
      const filters = req.query;

      const result = await dealQuoteRequestService.getBuyerDealQuotes(
        buyerId,
        filters
      );

      // Format response
      const formattedQuotes = result.dealQuotes.map((quote) => {
        const seller = quote.sellerId;
        const deal = quote.bestDealId;
        const product = deal?.productId;

        return {
          _id: quote._id,
          status: quote.currentStatus,
          message: quote.message,
          createdAt: quote.createdAt,
          updatedAt: quote.updatedAt,
          seller: seller
            ? {
                _id: seller._id,
                name: `${seller.firstName} ${seller.lastName}`.trim(),
                email: seller.email,
                phone: seller.phone,
                company: seller.company,
              }
            : null,
          deal: deal
            ? {
                _id: deal._id,
                title: deal.title,
                description: deal.description,
                dealPrice: deal.dealPrice,
                productName: product?.productName || deal.title,
                productImage: product?.productImages?.[0]?.fileUrl || null,
              }
            : null,
          orderDetails: {
            quantity: quote.desiredQuantity,
            shippingCountry: quote.shippingCountry,
            paymentTerms: quote.paymentTerms,
            deliveryDeadline: quote.deliveryDeadline,
          },
          sellerResponse: quote.sellerResponse,
          statusHistory: quote.status,
        };
      });

      res.status(200).json({
        success: true,
        message: "Your deal quote requests retrieved successfully",
        data: formattedQuotes,
        meta: {
          pagination: result.pagination,
        },
      });
    } catch (error) {
      console.error("Error fetching buyer deal quotes:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch deal quote requests",
      });
    }
  }

  /**
   * Get single deal quote by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.user_type || "user";

      const dealQuote = await dealQuoteRequestService.getDealQuoteById(
        id,
        userId,
        userRole
      );

      const buyer = dealQuote.buyerId;
      const seller = dealQuote.sellerId;
      const deal = dealQuote.bestDealId;
      const product = deal?.productId;

      const formattedResponse = {
        _id: dealQuote._id,
        status: dealQuote.currentStatus,
        message: dealQuote.message,
        createdAt: dealQuote.createdAt,
        updatedAt: dealQuote.updatedAt,
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
            }
          : null,
        deal: deal
          ? {
              _id: deal._id,
              title: deal.title,
              description: deal.description,
              dealPrice: deal.dealPrice,
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
                    manufacturingMethod: product.manufacturingMethod,
                  }
                : null,
            }
          : null,
        orderDetails: {
          quantity: dealQuote.desiredQuantity,
          shippingCountry: dealQuote.shippingCountry,
          paymentTerms: dealQuote.paymentTerms,
          deliveryDeadline: dealQuote.deliveryDeadline,
        },
        sellerResponse: dealQuote.sellerResponse,
        statusHistory: dealQuote.status,
        adminNote: dealQuote.adminNote,
      };

      res.status(200).json({
        success: true,
        message: "Deal quote request detail retrieved successfully",
        data: formattedResponse,
      });
    } catch (error) {
      console.error("Error fetching deal quote detail:", error);
      const status = error.message.includes("not found") ? 404 : error.message.includes("not authorized") ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to fetch deal quote request detail",
      });
    }
  }

  /**
   * Update deal quote status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, message } = req.body;
      const userId = req.user.id;
      const userRole = req.user.user_type || "user";

      if (!status || !message) {
        return res.status(400).json({
          success: false,
          message: "Status and message are required",
        });
      }

      const dealQuote = await dealQuoteRequestService.updateDealQuoteStatus(
        id,
        { status, message, updatedBy: userRole === "admin" ? "admin" : "seller" },
        userId
      );

      res.status(200).json({
        success: true,
        message: "Deal quote status updated successfully",
        data: dealQuote,
      });
    } catch (error) {
      console.error("Error updating deal quote status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update deal quote status",
      });
    }
  }

  /**
   * Seller responds to deal quote
   */
  async sellerRespond(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.id;
      const responseData = req.body;

      // Parse quotationDocument if it's a JSON string
      if (responseData.quotationDocument && typeof responseData.quotationDocument === 'string') {
        try {
          responseData.quotationDocument = JSON.parse(responseData.quotationDocument);
        } catch (e) {
          console.error('Failed to parse quotationDocument:', e);
        }
      }

      const dealQuote = await dealQuoteRequestService.sellerRespond(
        id,
        sellerId,
        responseData
      );

      res.status(200).json({
        success: true,
        message: "Response sent successfully",
        data: dealQuote,
      });
    } catch (error) {
      console.error("Error sending seller response:", error);
      const status = error.message.includes("not authorized") ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to send response",
      });
    }
  }

  /**
   * Delete deal quote request
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.user_type || "user";

      await dealQuoteRequestService.deleteDealQuoteRequest(id, userId, userRole);

      res.status(200).json({
        success: true,
        message: "Deal quote request deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting deal quote:", error);
      const status = error.message.includes("not authorized") ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to delete deal quote request",
      });
    }
  }
}

export default new DealQuoteRequestController();
