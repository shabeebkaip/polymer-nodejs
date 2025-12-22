import SampleRequest from "../models/sampleRequest.js";

class SampleRequestRepository {
  /**
   * Create a new sample request
   */
  async create(data) {
    const sampleRequest = new SampleRequest(data);
    return await sampleRequest.save();
  }

  /**
   * Find sample requests with filters and pagination
   */
  async findWithFilters({ filter, sort, skip, limit, populate }) {
    let query = SampleRequest.find(filter);

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
  }

  /**
   * Count documents with filter
   */
  async count(filter) {
    return await SampleRequest.countDocuments(filter);
  }

  /**
   * Find one sample request
   */
  async findOne(filter, populate = []) {
    let query = SampleRequest.findOne(filter);

    if (populate && populate.length > 0) {
      populate.forEach((pop) => {
        query = query.populate(pop);
      });
    }

    return await query.exec();
  }

  /**
   * Find sample request by ID with populate
   */
  async findById(id, populate = []) {
    let query = SampleRequest.findById(id);

    if (populate && populate.length > 0) {
      populate.forEach((pop) => {
        query = query.populate(pop);
      });
    }

    return await query.exec();
  }

  /**
   * Find sample requests by product IDs
   */
  async findByProductIds(productIds, populate = []) {
    let query = SampleRequest.find({ product: { $in: productIds } });

    if (populate && populate.length > 0) {
      populate.forEach((pop) => {
        query = query.populate(pop);
      });
    }

    return await query.exec();
  }

  /**
   * Update sample request
   */
  async update(id, data) {
    return await SampleRequest.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Update sample request status
   */
  async updateStatus(id, status) {
    return await SampleRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete sample request
   */
  async delete(id) {
    return await SampleRequest.findByIdAndDelete(id);
  }

  /**
   * Get status summary for admin (all requests)
   */
  async getStatusSummaryForAdmin() {
    return await SampleRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
  }

  /**
   * Get status summary for buyer
   */
  async getStatusSummaryForBuyer(userId) {
    return await SampleRequest.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
  }

  /**
   * Get status summary for seller's products
   */
  async getStatusSummaryForSeller(productIds) {
    return await SampleRequest.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
  }
}

export default new SampleRequestRepository();
