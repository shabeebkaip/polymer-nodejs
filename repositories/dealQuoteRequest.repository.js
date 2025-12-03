import DealQuoteRequest from "../models/dealQuoteRequest.js";

class DealQuoteRequestRepository {
  /**
   * Create a new deal quote request
   */
  async create(data) {
    const dealQuote = new DealQuoteRequest(data);
    return await dealQuote.save();
  }

  /**
   * Find deal quote requests with filters and pagination
   */
  async findWithFilters({ filter, sort, skip, limit, populate }) {
    let query = DealQuoteRequest.find(filter);

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
    return await DealQuoteRequest.countDocuments(filter);
  }

  /**
   * Find one deal quote request
   */
  async findOne(filter, populate = []) {
    let query = DealQuoteRequest.findOne(filter);

    populate.forEach((pop) => {
      query = query.populate(pop);
    });

    return await query.exec();
  }

  /**
   * Find by ID
   */
  async findById(id, populate = []) {
    let query = DealQuoteRequest.findById(id);

    populate.forEach((pop) => {
      query = query.populate(pop);
    });

    return await query.exec();
  }

  /**
   * Update deal quote request
   */
  async update(id, data) {
    return await DealQuoteRequest.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete deal quote request
   */
  async delete(id) {
    return await DealQuoteRequest.findByIdAndDelete(id);
  }

  /**
   * Get status summary for a seller
   */
  async getStatusSummary(sellerId) {
    const results = await DealQuoteRequest.aggregate([
      { $match: { sellerId } },
      {
        $addFields: {
          currentStatus: { $arrayElemAt: ["$status.status", -1] }
        }
      },
      { $group: { _id: "$currentStatus", count: { $sum: 1 } } },
    ]);

    return results.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }

  /**
   * Add status to history
   */
  async addStatusMessage(id, statusData) {
    return await DealQuoteRequest.findByIdAndUpdate(
      id,
      {
        $push: { status: statusData },
      },
      { new: true }
    );
  }
}

export default new DealQuoteRequestRepository();
