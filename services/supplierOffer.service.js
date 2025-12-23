import * as supplierOfferRepository from "../repositories/supplierOffer.repository.js";
import BulkOrder from "../models/bulkOrder.js";
import Notification from "../models/notification.js";
import mongoose from "mongoose";

class SupplierOfferService {
  /**
   * Create a new supplier offer
   */
  async createSupplierOffer(data) {
    const { bulkOrderId, supplierId } = data;

    // Validate bulk order exists
    const bulkOrder = await BulkOrder.findById(bulkOrderId).populate({
      path: "createdBy",
      select: "_id firstName lastName email",
    });

    if (!bulkOrder) {
      throw new Error("Bulk order not found");
    }

    // Check if bulk order is approved
    if (bulkOrder.status !== "approved") {
      throw new Error("Can only submit offers to approved bulk orders");
    }

    const offer = await supplierOfferRepository.create({
      ...data,
      status: "pending",
      statusMessage: [
        {
          status: "pending",
          message: "Supplier offer submitted",
          date: new Date(),
          updatedBy: "buyer",
        },
      ],
    });

    // Send notification to bulk order creator
    try {
      if (bulkOrder.createdBy?._id) {
        await Notification.create({
          userId: bulkOrder.createdBy._id,
          type: "supplier-offer",
          message: "A supplier submitted an offer for your bulk order request.",
          redirectUrl: `/user/product-requests/${bulkOrderId}`,
          relatedId: offer._id,
          meta: {
            supplierId,
            offerId: offer._id,
          },
        });
      }
    } catch (notifyErr) {
      console.error("Failed to notify bulk order creator:", notifyErr);
    }

    return offer;
  }

  /**
   * Get all supplier offers for admin
   */
  async getAdminSupplierOffers(filters) {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const populate = [
      {
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date",
        populate: {
          path: "product",
          select: "productName chemicalName tradeName",
        },
      },
      {
        path: "supplierId",
        select: "firstName lastName email company phone",
      },
    ];

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [offers, total] = await Promise.all([
      supplierOfferRepository.findWithFilters({
        filter,
        sort,
        skip,
        limit: parseInt(limit),
        populate,
      }),
      supplierOfferRepository.count(filter),
    ]);

    return {
      offers,
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
   * Get supplier offers for a specific bulk order
   */
  async getOffersByBulkOrderId(bulkOrderId, userId = null) {
    const filter = { bulkOrderId: new mongoose.Types.ObjectId(bulkOrderId) };

    const populate = [
      {
        path: "supplierId",
        select: "firstName lastName email company phone",
      },
      {
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date user",
      },
    ];

    const offers = await supplierOfferRepository.findWithFilters({
      filter,
      sort: { createdAt: -1 },
      populate,
    });

    // If userId provided, verify they own the bulk order
    if (userId && offers.length > 0) {
      const bulkOrder = offers[0].bulkOrderId;
      if (bulkOrder.user.toString() !== userId.toString()) {
        throw new Error("Unauthorized access to offers");
      }
    }

    return offers;
  }

  /**
   * Get approved supplier offers for a bulk order
   */
  async getApprovedOffersByBulkOrderId(bulkOrderId) {
    const filter = {
      bulkOrderId: new mongoose.Types.ObjectId(bulkOrderId),
      status: "approved",
    };

    const populate = [
      {
        path: "supplierId",
        select: "firstName lastName email company",
      },
      {
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date",
      },
    ];

    return await supplierOfferRepository.findWithFilters({
      filter,
      sort: { createdAt: -1 },
      populate,
    });
  }

  /**
   * Get supplier's submitted offers history
   */
  async getSupplierOffersHistory(supplierId, filters) {
    const { page = 1, limit = 10, status } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { supplierId: new mongoose.Types.ObjectId(supplierId) };

    if (status) {
      filter.status = status;
    }

    const populate = [
      {
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date status createdAt user",
        populate: [
          {
            path: "product",
            select: "productName chemicalName tradeName",
          },
          {
            path: "user",
            select: "firstName lastName email company",
          },
        ],
      },
    ];

    const [offers, total, statusCounts] = await Promise.all([
      supplierOfferRepository.findWithFilters({
        filter,
        sort: { createdAt: -1 },
        skip,
        limit: parseInt(limit),
        populate,
      }),
      supplierOfferRepository.count(filter),
      supplierOfferRepository.getSupplierStatusCounts(
        new mongoose.Types.ObjectId(supplierId)
      ),
    ]);

    return {
      offers,
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
   * Get supplier offer detail
   */
  async getSupplierOfferDetail(bulkOrderId, supplierId) {
    if (!mongoose.Types.ObjectId.isValid(bulkOrderId)) {
      throw new Error("Invalid bulk order ID");
    }

    const filter = {
      bulkOrderId: new mongoose.Types.ObjectId(bulkOrderId),
      supplierId: new mongoose.Types.ObjectId(supplierId),
    };

    const populate = [
      {
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date status createdAt notes user",
        populate: [
          {
            path: "product",
            select: "productName chemicalName tradeName description productImages countryOfOrigin color",
          },
          {
            path: "user",
            select: "firstName lastName email company phone address city state country",
          },
        ],
      },
    ];

    const offers = await supplierOfferRepository.findWithFilters({
      filter,
      populate,
    });

    if (!offers || offers.length === 0) {
      throw new Error("Offer not found for this bulk order");
    }

    return offers[0];
  }

  /**
   * Update supplier offer status (buyer)
   */
  async updateOfferStatus(offerId, status, buyerNote, userId) {
    const validStatuses = ["approved", "rejected"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    const offer = await supplierOfferRepository.findById(offerId, [
      { path: "bulkOrderId", select: "user" },
    ]);

    if (!offer) {
      throw new Error("Offer not found");
    }

    // Verify buyer owns the bulk order
    if (offer.bulkOrderId.user.toString() !== userId.toString()) {
      throw new Error("Unauthorized to update this offer");
    }

    const newStatusMessage = {
      status,
      message: buyerNote || `Status updated to ${status}`,
      updatedBy: "buyer",
      date: new Date(),
    };

    return await supplierOfferRepository.updateById(offerId, {
      status,
      $push: { statusMessage: newStatusMessage },
    });
  }
}

export default new SupplierOfferService();
