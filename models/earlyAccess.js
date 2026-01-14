import mongoose from "mongoose";
import { Schema } from "mongoose";

const earlyAccessSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["buyer", "supplier"],
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "contacted", "approved", "rejected"],
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    notes: {
      type: String,
    },
    contactedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
earlyAccessSchema.index({ email: 1, userType: 1 });
earlyAccessSchema.index({ status: 1 });
earlyAccessSchema.index({ createdAt: -1 });

const EarlyAccess = mongoose.model("EarlyAccess", earlyAccessSchema);

export default EarlyAccess;
