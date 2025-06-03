import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    senderId: String,
    receiverId: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", schema);
export default Message;
