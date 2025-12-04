import QuoteComment from "../models/quoteComment.js";

class QuoteCommentRepository {
  /**
   * Create a new comment
   */
  async create(data) {
    const comment = new QuoteComment(data);
    return await comment.save();
  }

  /**
   * Find comments by quote request ID
   */
  async findByQuoteRequestId(quoteRequestId, options = {}) {
    const { includeDeleted = false, page = 1, limit = 50 } = options;

    const filter = { quoteRequestId };
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      QuoteComment.find(filter)
        .populate({
          path: "userId",
          select: "firstName lastName email company",
        })
        .sort({ createdAt: 1 }) // Oldest first (chronological order)
        .skip(skip)
        .limit(limit)
        .lean(),
      QuoteComment.countDocuments(filter),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Count comments by quote request ID
   */
  async countByQuoteRequestId(quoteRequestId, includeDeleted = false) {
    const filter = { quoteRequestId };
    if (!includeDeleted) {
      filter.isDeleted = false;
    }
    return await QuoteComment.countDocuments(filter);
  }

  /**
   * Find comment by ID
   */
  async findById(id, populate = []) {
    let query = QuoteComment.findById(id);

    if (populate.length > 0) {
      populate.forEach((pop) => {
        query = query.populate(pop);
      });
    }

    return await query;
  }

  /**
   * Soft delete a comment
   */
  async softDelete(id) {
    return await QuoteComment.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Hard delete a comment
   */
  async delete(id) {
    return await QuoteComment.findByIdAndDelete(id);
  }

  /**
   * Update a comment
   */
  async update(id, data) {
    return await QuoteComment.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Get comments with pagination
   */
  async findWithPagination(filter, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      populate = [],
    } = options;

    const skip = (page - 1) * limit;

    let query = QuoteComment.find(filter).sort(sort).skip(skip).limit(limit);

    if (populate.length > 0) {
      populate.forEach((pop) => {
        query = query.populate(pop);
      });
    }

    const [comments, total] = await Promise.all([
      query,
      QuoteComment.countDocuments(filter),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find comments by user ID
   */
  async findByUserId(userId, options = {}) {
    const { includeDeleted = false, sort = { createdAt: -1 }, limit, skip } = options;

    const filter = { userId };
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    let query = QuoteComment.find(filter)
      .populate({
        path: "quoteRequestId",
        select: "productId buyerId sellerId status",
      })
      .sort(sort);

    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);

    return await query;
  }
}

export default new QuoteCommentRepository();
