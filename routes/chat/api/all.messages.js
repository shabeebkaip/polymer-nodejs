import express from 'express'
import Message from '../../../models/message.js';

const allMessagesRouter = express.Router()

allMessagesRouter.get('', async (req, res) => {
    try {
        const { senderId, receiverId } = req.query;
        if (!senderId || !receiverId) {
            return res.status(400).json({ error: 'senderId and receiverId are required' });
        }
        const messages = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

export default allMessagesRouter