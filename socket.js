import Message from "./models/message.js";
import User from "./models/user.js";
import Product from "./models/product.js";

// Track online users: { userId: socketId }
const onlineUsers = {};

// In-memory buffer for unsaved product chat messages
let productMessageBuffer = [];
const BUFFER_SAVE_INTERVAL_MS = 10000; // 10 seconds

// Periodically flush buffer to DB
setInterval(async () => {
    if (productMessageBuffer.length > 0) {
        const toSave = productMessageBuffer;
        productMessageBuffer = [];
        try {
            await Message.insertMany(toSave);
            console.log(`[ProductChat] Flushed ${toSave.length} messages to DB.`);
        } catch (err) {
            // If DB write fails, re-buffer the messages
            productMessageBuffer = toSave.concat(productMessageBuffer);
            console.error('[ProductChat] Failed to flush messages to DB:', err);
        }
    }
}, BUFFER_SAVE_INTERVAL_MS);

export default function initSocket(io) {
    io.on('connection', (socket) => {
        console.log('Socket Connected:', socket.id);

        // Join user to their personal room
        socket.on('join', (userId) => {
            socket.join(userId);
            onlineUsers[userId] = socket.id;
            console.log(`[ProductChat] User ${userId} joined their room (online)`);
            io.emit('userOnlineStatus', { userId, isOnline: true });
        });

        // Join a specific product chat room
        socket.on('joinProductChat', async ({ userId, productId }) => {
            if (!productId || typeof productId !== 'string' || productId.length !== 24) {
                console.warn(`[ProductChat] joinProductChat: Invalid productId received from user ${userId}:`, productId);
                return;
            }
            const roomName = `product_${productId}`;
            socket.join(roomName);
            console.log(`[ProductChat] User ${userId} joined product chat room: ${roomName}`);

            // --- Notify the supplier ---
            try {
                const product = await Product.findById(productId).lean();
                if (product && product.createdBy && product.createdBy.toString() !== userId) {
                    const buyer = await User.findById(userId).select('firstName lastName company');
                    io.to(product.createdBy.toString()).emit('chatInvite', {
                        productId,
                        buyerId: userId,
                        buyerName: buyer ? `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() : 'Buyer',
                        productName: product.productName,
                    });
                }
            } catch (err) {
                console.error('[ProductChat] Failed to emit chatInvite:', err);
            }
        });

        // Handle product-specific messages (buyer-seller chat for products)
        socket.on('sendProductMessage', async ({ senderId, receiverId, message, productId }) => {
            if (!productId || typeof productId !== 'string' || productId.length !== 24) {
                console.warn('[ProductChat] sendProductMessage: Invalid productId:', productId);
                socket.emit('messageError', { error: 'Invalid productId' });
                return;
            }
            try {
                // Prepare message object but do NOT save immediately
                const newMsg = new Message({ 
                    senderId, 
                    receiverId, 
                    message,
                    productId,
                    messageType: 'text',
                    createdAt: new Date()
                });
                // Buffer the message for later DB save
                productMessageBuffer.push(newMsg.toObject());

                // Get user details manually to avoid population issues
                try {
                    const sender = await User.findById(senderId).select('firstName lastName company profile_image');
                    const formattedMessage = {
                        _id: newMsg._id,
                        message: newMsg.message,
                        senderId: newMsg.senderId,
                        receiverId: newMsg.receiverId,
                        senderName: sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() : 'User',
                        senderCompany: sender?.company || '',
                        senderImage: sender?.profile_image || '',
                        productId: newMsg.productId,
                        messageType: newMsg.messageType,
                        isRead: newMsg.isRead,
                        createdAt: newMsg.createdAt
                    };
                    io.to(receiverId).emit('receiveProductMessage', formattedMessage);
                    const roomName = `product_${productId}`;
                    socket.to(roomName).emit('receiveProductMessage', formattedMessage);
                    socket.emit('messageSent', formattedMessage);
                } catch (userError) {
                    const basicMessage = {
                        _id: newMsg._id,
                        message: newMsg.message,
                        senderId: newMsg.senderId,
                        receiverId: newMsg.receiverId,
                        senderName: 'User',
                        senderCompany: '',
                        senderImage: '',
                        productId: newMsg.productId,
                        messageType: newMsg.messageType,
                        isRead: newMsg.isRead,
                        createdAt: newMsg.createdAt
                    };
                    io.to(receiverId).emit('receiveProductMessage', basicMessage);
                    const roomName = `product_${productId}`;
                    socket.to(roomName).emit('receiveProductMessage', basicMessage);
                    socket.emit('messageSent', basicMessage);
                }
            } catch (error) {
                console.error('[ProductChat] Error sending product message:', error);
                socket.emit('messageError', { error: 'Failed to send message' });
            }
        });

        // Mark messages as read (product chat only)
        socket.on('markAsRead', async ({ messageIds, userId }) => {
            try {
                await Message.updateMany(
                    { 
                        _id: { $in: messageIds }, 
                        receiverId: userId 
                    },
                    { isRead: true }
                );
                socket.emit('messagesMarkedAsRead', { messageIds });
            } catch (error) {
                console.error('[ProductChat] Error marking messages as read:', error);
            }
        });

        // Leave product chat room
        socket.on('leaveProductChat', ({ userId, productId }) => {
            const roomName = `product_${productId}`;
            socket.leave(roomName);
            console.log(`[ProductChat] User ${userId} left product chat room: ${roomName}`);
        });

        // Handle typing indicators for product chats
        socket.on('typing', ({ productId, userId, isTyping, receiverId }) => {
            if (productId) {
                const roomName = `product_${productId}`;
                socket.to(roomName).emit('userTyping', { userId, isTyping });
            } else if (receiverId) {
                socket.to(receiverId).emit('userTyping', { userId, isTyping });
            }
        });

        // Add a socket event to check if a user is online
        socket.on('checkUserOnline', (userId, callback) => {
            const isOnline = !!onlineUsers[userId];
            if (typeof callback === 'function') {
                callback({ userId, isOnline });
            } else {
                socket.emit('userOnlineStatus', { userId, isOnline });
            }
        });

        // Real-time fetch product chat messages
        socket.on('getProductMessages', async ({ productId }, callback) => {
            if (!productId || typeof productId !== 'string' || productId.length !== 24) {
                console.warn('[ProductChat] getProductMessages: Invalid productId:', productId);
                if (typeof callback === 'function') {
                    callback([]);
                }
                return;
            }
            // Get messages from buffer (unsaved)
            const buffered = productMessageBuffer.filter(m => m.productId == productId);
            // Get messages from DB (saved)
            const dbMessages = await Message.find({ productId }).sort({ createdAt: 1 }).lean();
            // Combine and sort all messages by createdAt
            const allMessages = dbMessages.concat(buffered).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            if (typeof callback === 'function') {
                callback(allMessages);
            }
        });

        socket.on('disconnect', () => {
            // Flush buffer on disconnect (optional, for safety)
            if (productMessageBuffer.length > 0) {
                Message.insertMany(productMessageBuffer).then(() => {
                    console.log(`[ProductChat] Flushed ${productMessageBuffer.length} messages to DB on disconnect.`);
                    productMessageBuffer = [];
                }).catch((err) => {
                    console.error('[ProductChat] Failed to flush messages to DB on disconnect:', err);
                });
            }
            for (const [userId, sockId] of Object.entries(onlineUsers)) {
                if (sockId === socket.id) {
                    delete onlineUsers[userId];
                    io.emit('userOnlineStatus', { userId, isOnline: false });
                    break;
                }
            }
            console.log('[ProductChat] Socket disconnected:', socket.id);
        });
    });
}
