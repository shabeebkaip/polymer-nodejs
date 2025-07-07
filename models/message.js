import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'UnifiedQuoteRequest' }, // Optional: for quote-specific chats
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Optional: for product-specific chats
    messageType: { type: String, enum: ['text', 'file', 'image'], default: 'text' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Index for better query performance
schema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
schema.index({ quoteId: 1, createdAt: -1 });
schema.index({ productId: 1, createdAt: -1 });

const Message = mongoose.model("Message", schema);
export default Message;
