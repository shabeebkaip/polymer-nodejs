import QuoteRequest from "../models/quoteRequest.js";

class QuoteRequestRepository {
  /**
   * Create a new quote request
   */
  async create(data) {
    const quoteRequest = new QuoteRequest(data);
    return await quoteRequest.save();
  }

  /**
   * Find quote requests with filters and pagination
   */
  async findWithFilters({ filter, sort, skip, limit, populate }) {
    let query = QuoteRequest.find(filter);

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
    return await QuoteRequest.countDocuments(filter);
  }

  /**
   * Find one quote request
   */
  async findOne(filter, populate = []) {
    let query = QuoteRequest.findOne(filter);

    populate.forEach((pop) => {
      query = query.populate(pop);
    });

    return await query.exec();
  }

  /**
   * Find by ID
   */
  async findById(id, populate = []) {
    let query = QuoteRequest.findById(id);

    populate.forEach((pop) => {
      query = query.populate(pop);
    });

    return await query.exec();
  }

  /**
   * Update quote request
   */
  async update(id, data) {
    return await QuoteRequest.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete quote request
   */
  async delete(id) {
    return await QuoteRequest.findByIdAndDelete(id);
  }

  /**
   * Get status summary for a seller
   */
  async getStatusSummary(sellerId) {
    const results = await QuoteRequest.aggregate([
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
    return await QuoteRequest.findByIdAndUpdate(
      id,
      {
        $push: { status: statusData },
      },
      { new: true }
    );
  }

  /**
   * Find quote requests by productId
   */
  async findByProductId(productId, populate = []) {
    let query = QuoteRequest.find({ productId });

    populate.forEach((pop) => {
      query = query.populate(pop);
    });

    return await query.sort({ createdAt: -1 }).exec();
  }
}

export default new QuoteRequestRepository();
