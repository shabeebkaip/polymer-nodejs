import DealQuoteComment from "../models/dealQuoteComment.js";

class DealQuoteCommentRepository {
  /**
   * Create a new comment
   */
  async create(commentData) {
    const comment = new DealQuoteComment(commentData);
    return await comment.save();
  }

  /**
   * Find comment by ID
   */
  async findById(commentId) {
    return await DealQuoteComment.findById(commentId)
      .populate("userId", "name email user_type")
      .lean();
  }

  /**
   * Get all comments for a deal quote request
   */
  async findByDealQuoteRequestId(dealQuoteRequestId, options = {}) {
    const { includeDeleted = false, page = 1, limit = 50 } = options;

    const query = { dealQuoteRequestId };
    if (!includeDeleted) {
      query.isDeleted = false;
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      DealQuoteComment.find(query)
        .populate("userId", "name email user_type")
        .sort({ createdAt: 1 }) // Oldest first (chronological order)
        .skip(skip)
        .limit(limit)
        .lean(),
      DealQuoteComment.countDocuments(query),
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
   * Update a comment
   */
  async update(commentId, updateData) {
    return await DealQuoteComment.findByIdAndUpdate(
      commentId,
      {
        ...updateData,
        isEdited: true,
        editedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("userId", "name email user_type")
      .lean();
  }

  /**
   * Soft delete a comment
   */
  async softDelete(commentId) {
    return await DealQuoteComment.findByIdAndUpdate(
      commentId,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    ).lean();
  }

  /**
   * Hard delete a comment (admin only)
   */
  async hardDelete(commentId) {
    return await DealQuoteComment.findByIdAndDelete(commentId);
  }

  /**
   * Get comment count for a deal quote request
   */
  async getCommentCount(dealQuoteRequestId) {
    return await DealQuoteComment.countDocuments({
      dealQuoteRequestId,
      isDeleted: false,
    });
  }

  /**
   * Get user's comments for a deal quote request
   */
  async findByUserAndDealQuoteRequest(userId, dealQuoteRequestId) {
    return await DealQuoteComment.find({
      userId,
      dealQuoteRequestId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();
  }
}

export default new DealQuoteCommentRepository();
