import SupplierOfferRequest from "../models/supplierOfferRequest.js";

/**
 * Create a new supplier offer
 */
export const create = async (data) => {
  const supplierOffer = new SupplierOfferRequest(data);
  return await supplierOffer.save();
};

/**
 * Find supplier offer by ID with populate
 */
export const findById = async (id, populate = []) => {
  let query = SupplierOfferRequest.findById(id);

  if (populate && populate.length > 0) {
    populate.forEach((pop) => {
      query = query.populate(pop);
    });
  }

  return await query.exec();
};

/**
 * Find supplier offers with filters and pagination
 */
export const findWithFilters = async ({ filter, sort, skip, limit, populate }) => {
  let query = SupplierOfferRequest.find(filter);

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
  return await SupplierOfferRequest.countDocuments(filter);
};

/**
 * Update supplier offer by ID
 */
export const updateById = async (id, data) => {
  return await SupplierOfferRequest.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

/**
 * Delete supplier offer by ID
 */
export const deleteById = async (id) => {
  return await SupplierOfferRequest.findByIdAndDelete(id);
};

/**
 * Get status counts for supplier
 */
export const getSupplierStatusCounts = async (supplierId) => {
  const counts = await SupplierOfferRequest.aggregate([
    { $match: { supplierId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    totalSubmitted: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  counts.forEach((item) => {
    result.totalSubmitted += item.count;
    if (item._id === "pending") result.pending = item.count;
    if (item._id === "approved") result.approved = item.count;
    if (item._id === "rejected") result.rejected = item.count;
  });

  return result;
};
