import SampleRequestComment from "../models/sampleRequestComment.js";

class SampleRequestCommentRepository {
  /**
   * Create a new comment
   */
  async create(commentData) {
    const comment = new SampleRequestComment(commentData);
    return await comment.save();
  }

  /**
   * Find comment by ID
   */
  async findById(commentId) {
    return await SampleRequestComment.findById(commentId)
      .populate("userId", "email user_type")
      .lean();
  }

  /**
   * Get all comments for a sample request
   */
  async findBySampleRequestId(sampleRequestId, options = {}) {
    const { includeDeleted = false, page = 1, limit = 50 } = options;

    const query = { sampleRequestId };
    if (!includeDeleted) {
      query.isDeleted = false;
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      SampleRequestComment.find(query)
        .populate("userId", "email user_type")
        .sort({ createdAt: 1 }) // Oldest first (chronological order)
        .skip(skip)
        .limit(limit)
        .lean(),
      SampleRequestComment.countDocuments(query),
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
    return await SampleRequestComment.findByIdAndUpdate(
      commentId,
      {
        ...updateData,
        isEdited: true,
        editedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("userId", "email user_type")
      .lean();
  }

  /**
   * Soft delete a comment
   */
  async softDelete(commentId) {
    return await SampleRequestComment.findByIdAndUpdate(
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
    return await SampleRequestComment.findByIdAndDelete(commentId);
  }

  /**
   * Get comment count for a sample request
   */
  async getCommentCount(sampleRequestId) {
    return await SampleRequestComment.countDocuments({
      sampleRequestId,
      isDeleted: false,
    });
  }

  /**
   * Check if user has access to comment (is buyer or seller)
   */
  async checkUserAccess(commentId, userId) {
    const comment = await SampleRequestComment.findById(commentId).lean();
    if (!comment) return false;
    return comment.userId.toString() === userId.toString();
  }
}

export default new SampleRequestCommentRepository();
