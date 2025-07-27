import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    type: {
      type: String,
      enum: [
        "chat",
        "quote-status",
        "sample-status",
        "quote-submission",
        "quote-enquiry",
        "sample-enquiry",
        "supplier-offer"
      ],
      required: true
    },
    message: { type: String, required: true },
    redirectUrl: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedId: { type: Schema.Types.ObjectId }, // e.g., chat room, quote, sample, etc.
    meta: { type: Schema.Types.Mixed }, // optional extra data
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
