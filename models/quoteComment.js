import mongoose, { Schema } from "mongoose";

const quoteCommentSchema = new Schema(
  {
    // Reference to the quote request
    quoteRequestId: {
      type: Schema.Types.ObjectId,
      ref: "QuoteRequest",
      required: true,
      index: true,
    },

    // Who posted the comment
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    // User role at the time of comment (for display purposes)
    userRole: {
      type: String,
      required: true,
      enum: ["buyer", "seller", "admin"],
    },

    // Comment content
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },

    // Optional attachments
    attachments: [
      {
        id: { type: String },
        name: { type: String },
        type: { type: String },
        fileUrl: { type: String },
        viewUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Comment metadata
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
quoteCommentSchema.index({ quoteRequestId: 1, createdAt: -1 });
quoteCommentSchema.index({ userId: 1, createdAt: -1 });
quoteCommentSchema.index({ quoteRequestId: 1, isDeleted: 1, createdAt: -1 });

const QuoteComment = mongoose.model("QuoteComment", quoteCommentSchema);

export default QuoteComment;
