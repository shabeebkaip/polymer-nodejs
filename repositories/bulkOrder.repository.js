import BulkOrder from "../models/bulkOrder.js";
import SupplierOfferRequest from "../models/supplierOfferRequest.js";

/**
 * Create a new bulk order
 */
export const create = async (data) => {
  const bulkOrder = new BulkOrder(data);
  return await bulkOrder.save();
};

/**
 * Find bulk order by ID with populate
 */
export const findById = async (id, populate = []) => {
  let query = BulkOrder.findById(id);

  if (populate && populate.length > 0) {
    populate.forEach((pop) => {
      query = query.populate(pop);
    });
  }

  return await query.exec();
};

/**
 * Find bulk orders with filters and pagination
 */
export const findWithFilters = async ({ filter, sort, skip, limit, populate }) => {
  let query = BulkOrder.find(filter);

  if (populate) {
    populate.forEach((pop) => {
      query = query.populate(pop);
    });
  }

  if (sort) {
    query = query.sort(sort);
  }

  if (skip !== undefined) {
    query = query.skip(skip);
  }

  if (limit) {
    query = query.limit(limit);
  }

  return await query.exec();
};

/**
 * Count documents with filter
 */
export const count = async (filter) => {
  return await BulkOrder.countDocuments(filter);
};

/**
 * Update bulk order by ID
 */
export const updateById = async (id, data) => {
  return await BulkOrder.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

/**
 * Delete bulk order by ID
 */
export const deleteById = async (id) => {
  return await BulkOrder.findByIdAndDelete(id);
};

/**
 * Get approved bulk orders with offer counts
 */
export const getApprovedWithOfferCounts = async (filter = {}) => {
  const query = {
    status: "approved",
    $or: [
      { delivery_date: { $gte: new Date() } },
      { delivery_date: { $exists: false } },
      { delivery_date: null },
    ],
    ...filter,
  };

  const approvedOrders = await BulkOrder.find(query)
    .populate({
      path: "product",
      select: "productName chemicalName tradeName productImages countryOfOrigin color polymerType chemicalFamily",
      populate: [
        { path: "polymerType", select: "name" },
        { path: "chemicalFamily", select: "name" },
      ],
    })
    .populate({
      path: "user",
      select: "firstName lastName company email phone city country userType",
    })
    .sort({ createdAt: -1 });

  // Get offer counts
  const orderIds = approvedOrders.map((order) => order._id);
  const offerCounts = await SupplierOfferRequest.aggregate([
    { $match: { bulkOrderId: { $in: orderIds } } },
    {
      $group: {
        _id: "$bulkOrderId",
        totalOffers: { $sum: 1 },
        pendingOffers: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        approvedOffers: {
          $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
        },
        rejectedOffers: {
          $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
        },
      },
    },
  ]);

  return { approvedOrders, offerCounts };
};

/**
 * Get bulk order detail with supplier offers
 */
export const getDetailWithOffers = async (id) => {
  const bulkOrder = await BulkOrder.findById(id)
    .populate({
      path: "user",
      select: "firstName lastName email phone company address city state country pincode userType",
    })
    .populate({
      path: "product",
      select: "productName chemicalName description tradeName productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy",
      populate: {
        path: "createdBy",
        select: "firstName lastName email phone company address city state country",
      },
    });

  if (!bulkOrder) {
    return null;
  }

  const offers = await SupplierOfferRequest.find({ bulkOrderId: id })
    .populate("supplierId", "firstName lastName email company")
    .populate({
      path: "bulkOrderId",
      select: "product quantity uom city country delivery_date",
    })
    .sort({ createdAt: -1 });

  return { bulkOrder, offers };
};
