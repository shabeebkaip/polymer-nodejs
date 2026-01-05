import supplierOfferService from "../services/supplierOffer.service.js";

class SupplierOfferController {
  /**
   * Create a new supplier offer
   * POST /api/bulk-order/supplier-offer/create
   */
  async createSupplierOffer(req, res) {
    try {
      const {
        bulkOrderId,
        pricePerUnit,
        availableQuantity,
        deliveryTimeInDays,
        incotermAndPackaging,
        message,
        offerDocument,
      } = req.body;

      const supplierId = req.user._id;

      // Validation
      if (!bulkOrderId || !pricePerUnit || !availableQuantity || !deliveryTimeInDays || !incotermAndPackaging) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const offer = await supplierOfferService.createSupplierOffer({
        bulkOrderId,
        supplierId,
        pricePerUnit: parseFloat(pricePerUnit),
        availableQuantity: parseInt(availableQuantity),
        deliveryTimeInDays: parseInt(deliveryTimeInDays),
        incotermAndPackaging,
        message,
        offerDocument,
      });

      return res.status(201).json({
        success: true,
        message: "Supplier offer created successfully",
        data: offer,
      });
    } catch (error) {
      console.error("Error creating supplier offer:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create supplier offer",
      });
    }
  }

  /**
   * Get supplier offers for a bulk order (buyer)
   * GET /api/bulk-order/supplier-offer/buyer/:bulkOrderId
   */
  async getBuyerSupplierOffers(req, res) {
    try {
      const { bulkOrderId } = req.params;
      const userId = req.user._id;

      const offers = await supplierOfferService.getOffersByBulkOrderId(bulkOrderId, userId);

      return res.status(200).json({
        success: true,
        message: "Supplier offers retrieved successfully",
        data: offers,
      });
    } catch (error) {
      console.error("Error fetching buyer supplier offers:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch supplier offers",
      });
    }
  }

  /**
   * Get approved supplier offers for a bulk order
   * GET /api/bulk-order/supplier-offer/approved/:bulkOrderId
   */
  async getApprovedSuppliers(req, res) {
    try {
      const { bulkOrderId } = req.params;

      const offers = await supplierOfferService.getApprovedOffersByBulkOrderId(bulkOrderId);

      return res.status(200).json({
        success: true,
        message: "Approved suppliers retrieved successfully",
        data: offers,
      });
    } catch (error) {
      console.error("Error fetching approved suppliers:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch approved suppliers",
      });
    }
  }

  /**
   * Get supplier's submitted offers history
   * GET /api/bulk-order/supplier-offer/supplier-history
   */
  async getSupplierHistory(req, res) {
    try {
      const supplierId = req.user._id;
      const { page, limit, status } = req.query;

      const result = await supplierOfferService.getSupplierOffersHistory(supplierId, {
        page,
        limit,
        status,
      });

      return res.status(200).json({
        success: true,
        message: "Supplier offers history retrieved successfully",
        data: result.offers,
        statusCounts: result.statusCounts,
        pagination: result.pagination,
        total: result.total,
      });
    } catch (error) {
      console.error("Error fetching supplier history:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch supplier history",
      });
    }
  }

  /**
   * Get supplier offer detail
   * GET /api/bulk-order/supplier-offer/detail/:bulkOrderId
   */
  async getSupplierOfferDetail(req, res) {
    try {
      const { bulkOrderId } = req.params;
      const supplierId = req.user._id;

      const offer = await supplierOfferService.getSupplierOfferDetail(bulkOrderId, supplierId);

      return res.status(200).json({
        success: true,
        message: "Supplier offer detail retrieved successfully",
        data: offer,
      });
    } catch (error) {
      console.error("Error fetching supplier offer detail:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch offer detail",
      });
    }
  }

  /**
   * Verify supplier offer (buyer)
   * PATCH /api/bulk-order/supplier-offer/verify/:offerId
   */
  async verifySupplierOfferBuyer(req, res) {
    try {
      const { offerId } = req.params;
      const { status, buyerNote } = req.body;
      const userId = req.user._id;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const offer = await supplierOfferService.updateOfferStatus(
        offerId,
        status,
        buyerNote,
        userId
      );

      return res.status(200).json({
        success: true,
        message: `Supplier offer ${status} successfully`,
        data: offer,
      });
    } catch (error) {
      console.error("Error verifying supplier offer:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to verify supplier offer",
      });
    }
  }

  /**
   * Get all supplier offers for admin
   * GET /api/bulk-order/supplier-offer/admin
   */
  async getAdminSupplierOffers(req, res) {
    try {
      const { page, limit, status, sortBy, sortOrder } = req.query;

      const result = await supplierOfferService.getAdminSupplierOffers({
        page,
        limit,
        status,
        sortBy,
        sortOrder,
      });

      return res.status(200).json({
        success: true,
        message: "Admin supplier offers retrieved successfully",
        data: result.offers,
        pagination: result.pagination,
        total: result.total,
      });
    } catch (error) {
      console.error("Error fetching admin supplier offers:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch supplier offers",
      });
    }
  }
}

export default new SupplierOfferController();
