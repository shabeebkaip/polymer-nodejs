import Message from "./models/message.js";

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
                await newMsg.save();

                // Populate sender and receiver info
                await newMsg.populate('senderId', 'firstName lastName company profile_image');
                await newMsg.populate('receiverId', 'firstName lastName company profile_image');

                const formattedMessage = {
                    _id: newMsg._id,
                    message: newMsg.message,
                    senderId: newMsg.senderId._id,
                    receiverId: newMsg.receiverId._id,
                    senderName: `${newMsg.senderId.firstName} ${newMsg.senderId.lastName}`,
                    senderCompany: newMsg.senderId.company,
                    senderImage: newMsg.senderId.profile_image,
                    productId: newMsg.productId,
                    messageType: newMsg.messageType,
                    isRead: newMsg.isRead,
                    createdAt: newMsg.createdAt
                };
                
                // Send to receiver's personal room
                io.to(receiverId).emit('receiveProductMessage', formattedMessage);
                
                // Send to product-specific room (if both users are in the room)
                const roomName = `product_${productId}`;
                socket.to(roomName).emit('receiveProductMessage', formattedMessage);

                // Send confirmation back to sender
                socket.emit('messageSent', formattedMessage);
                
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
                await newMsg.save();

                // Populate sender and receiver info
                await newMsg.populate('senderId', 'firstName lastName company profile_image');
                await newMsg.populate('receiverId', 'firstName lastName company profile_image');

                const formattedMessage = {
                    _id: newMsg._id,
                    message: newMsg.message,
                    senderId: newMsg.senderId._id,
                    receiverId: newMsg.receiverId._id,
                    senderName: `${newMsg.senderId.firstName} ${newMsg.senderId.lastName}`,
                    senderCompany: newMsg.senderId.company,
                    senderImage: newMsg.senderId.profile_image,
                    quoteId: newMsg.quoteId,
                    messageType: newMsg.messageType,
                    isRead: newMsg.isRead,
                    createdAt: newMsg.createdAt
                };
                
                // Send to receiver's personal room
                io.to(receiverId).emit('receiveQuoteMessage', formattedMessage);
                
                // Send to quote-specific room (if both users are in the room)
                const roomName = `quote_${quoteId}`;
                socket.to(roomName).emit('receiveQuoteMessage', formattedMessage);

                // Send confirmation back to sender
                socket.emit('messageSent', formattedMessage);
                
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
