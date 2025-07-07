import Message from "./models/message.js";
import User from "./models/user.js";

export default function initSocket(io) {
    io.on('connection', (socket) => {
        console.log('Socket Connected:', socket.id);

        // Join user to their personal room
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        });

        // Join a specific quote chat room
        socket.on('joinQuoteChat', ({ userId, quoteId }) => {
            const roomName = `quote_${quoteId}`;
            socket.join(roomName);
            console.log(`User ${userId} joined quote chat room: ${roomName}`);
        });

        // Join a specific product chat room
        socket.on('joinProductChat', ({ userId, productId }) => {
            const roomName = `product_${productId}`;
            socket.join(roomName);
            console.log(`User ${userId} joined product chat room: ${roomName}`);
        });

        // Handle regular messages (backward compatibility)
        socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
            try {
                const newMsg = new Message({ 
                    senderId, 
                    receiverId, 
                    message,
                    messageType: 'text'
                });
                await newMsg.save();
                
                // Send to receiver's personal room
                io.to(receiverId).emit('receiveMessage', {
                    _id: newMsg._id,
                    senderId: newMsg.senderId,
                    receiverId: newMsg.receiverId,
                    message: newMsg.message,
                    messageType: newMsg.messageType,
                    createdAt: newMsg.createdAt,
                    isRead: newMsg.isRead
                });
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('messageError', { error: 'Failed to send message' });
            }
        });

        // Handle product-specific messages (buyer-seller chat for products)
        socket.on('sendProductMessage', async ({ senderId, receiverId, message, productId }) => {
            try {
                const newMsg = new Message({ 
                    senderId, 
                    receiverId, 
                    message,
                    productId,
                    messageType: 'text'
                });
                const savedMessage = await newMsg.save();

                // Get user details manually to avoid population issues
                try {
                    const sender = await User.findById(senderId).select('firstName lastName company profile_image');
                    const receiver = await User.findById(receiverId).select('firstName lastName company profile_image');

                    const formattedMessage = {
                        _id: savedMessage._id,
                        message: savedMessage.message,
                        senderId: savedMessage.senderId,
                        receiverId: savedMessage.receiverId,
                        senderName: sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() : 'User',
                        senderCompany: sender?.company || '',
                        senderImage: sender?.profile_image || '',
                        productId: savedMessage.productId,
                        messageType: savedMessage.messageType,
                        isRead: savedMessage.isRead,
                        createdAt: savedMessage.createdAt
                    };
                    
                    // Send to receiver's personal room
                    io.to(receiverId).emit('receiveProductMessage', formattedMessage);
                    
                    // Send to product-specific room (if both users are in the room)
                    const roomName = `product_${productId}`;
                    socket.to(roomName).emit('receiveProductMessage', formattedMessage);

                    // Send confirmation back to sender
                    socket.emit('messageSent', formattedMessage);
                    
                } catch (userError) {
                    // If user lookup fails, send basic message
                    console.warn('User lookup failed, sending basic message:', userError.message);
                    
                    const basicMessage = {
                        _id: savedMessage._id,
                        message: savedMessage.message,
                        senderId: savedMessage.senderId,
                        receiverId: savedMessage.receiverId,
                        senderName: 'User',
                        senderCompany: '',
                        senderImage: '',
                        productId: savedMessage.productId,
                        messageType: savedMessage.messageType,
                        isRead: savedMessage.isRead,
                        createdAt: savedMessage.createdAt
                    };
                    
                    // Send to receiver's personal room
                    io.to(receiverId).emit('receiveProductMessage', basicMessage);
                    
                    // Send to product-specific room
                    const roomName = `product_${productId}`;
                    socket.to(roomName).emit('receiveProductMessage', basicMessage);

                    // Send confirmation back to sender
                    socket.emit('messageSent', basicMessage);
                }
                
            } catch (error) {
                console.error('Error sending product message:', error);
                socket.emit('messageError', { error: 'Failed to send message' });
            }
        });

        // Handle quote-specific messages (buyer-seller chat)
        socket.on('sendQuoteMessage', async ({ senderId, receiverId, message, quoteId }) => {
            try {
                const newMsg = new Message({ 
                    senderId, 
                    receiverId, 
                    message,
                    quoteId,
                    messageType: 'text'
                });
                const savedMessage = await newMsg.save();

                // Get user details manually to avoid population issues
                try {
                    const sender = await User.findById(senderId).select('firstName lastName company profile_image');
                    const receiver = await User.findById(receiverId).select('firstName lastName company profile_image');

                    const formattedMessage = {
                        _id: savedMessage._id,
                        message: savedMessage.message,
                        senderId: savedMessage.senderId,
                        receiverId: savedMessage.receiverId,
                        senderName: sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() : 'User',
                        senderCompany: sender?.company || '',
                        senderImage: sender?.profile_image || '',
                        quoteId: savedMessage.quoteId,
                        messageType: savedMessage.messageType,
                        isRead: savedMessage.isRead,
                        createdAt: savedMessage.createdAt
                    };
                    
                    // Send to receiver's personal room
                    io.to(receiverId).emit('receiveQuoteMessage', formattedMessage);
                    
                    // Send to quote-specific room (if both users are in the room)
                    const roomName = `quote_${quoteId}`;
                    socket.to(roomName).emit('receiveQuoteMessage', formattedMessage);

                    // Send confirmation back to sender
                    socket.emit('messageSent', formattedMessage);
                    
                } catch (userError) {
                    // If user lookup fails, send basic message
                    console.warn('User lookup failed for quote message, sending basic message:', userError.message);
                    
                    const basicMessage = {
                        _id: savedMessage._id,
                        message: savedMessage.message,
                        senderId: savedMessage.senderId,
                        receiverId: savedMessage.receiverId,
                        senderName: 'User',
                        senderCompany: '',
                        senderImage: '',
                        quoteId: savedMessage.quoteId,
                        messageType: savedMessage.messageType,
                        isRead: savedMessage.isRead,
                        createdAt: savedMessage.createdAt
                    };
                    
                    // Send to receiver's personal room
                    io.to(receiverId).emit('receiveQuoteMessage', basicMessage);
                    
                    // Send to quote-specific room
                    const roomName = `quote_${quoteId}`;
                    socket.to(roomName).emit('receiveQuoteMessage', basicMessage);

                    // Send confirmation back to sender
                    socket.emit('messageSent', basicMessage);
                }
                
            } catch (error) {
                console.error('Error sending quote message:', error);
                socket.emit('messageError', { error: 'Failed to send message' });
            }
        });

        // Mark messages as read
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
                console.error('Error marking messages as read:', error);
            }
        });

        // Leave quote chat room
        socket.on('leaveQuoteChat', ({ userId, quoteId }) => {
            const roomName = `quote_${quoteId}`;
            socket.leave(roomName);
            console.log(`User ${userId} left quote chat room: ${roomName}`);
        });

        // Leave product chat room
        socket.on('leaveProductChat', ({ userId, productId }) => {
            const roomName = `product_${productId}`;
            socket.leave(roomName);
            console.log(`User ${userId} left product chat room: ${roomName}`);
        });

        // Handle typing indicators for chats
        socket.on('typing', ({ quoteId, productId, userId, isTyping, receiverId }) => {
            if (quoteId) {
                const roomName = `quote_${quoteId}`;
                socket.to(roomName).emit('userTyping', { userId, isTyping });
            } else if (productId) {
                const roomName = `product_${productId}`;
                socket.to(roomName).emit('userTyping', { userId, isTyping });
            } else if (receiverId) {
                socket.to(receiverId).emit('userTyping', { userId, isTyping });
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });
}
