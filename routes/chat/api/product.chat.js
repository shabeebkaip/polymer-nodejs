import express from 'express';
import { authenticateUser } from '../../../middlewares/verify.token.js';
import Message from '../../../models/message.js';
import User from '../../../models/user.js';
import Product from '../../../models/product.js';

const productChatRouter = express.Router();

// Get seller info for a specific product
productChatRouter.get('/seller-info/:productId', authenticateUser, async (req, res) => {
    try {
        const { productId } = req.params;
        const buyerId = req.user.id;

        // Validate productId format
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        // Find the product and get seller info
        const product = await Product.findById(productId)
            .populate({
                path: 'createdBy',
                select: 'firstName lastName company email phone profile_image'
            });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (!product.createdBy) {
            return res.status(404).json({
                success: false,
                message: "Seller information not found for this product"
            });
        }

        // Check if buyer is trying to chat with themselves
        if (product.createdBy._id.toString() === buyerId.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot chat with yourself"
            });
        }

        const sellerInfo = {
            _id: product.createdBy._id,
            name: `${product.createdBy.firstName} ${product.createdBy.lastName}`,
            firstName: product.createdBy.firstName,
            lastName: product.createdBy.lastName,
            company: product.createdBy.company,
            email: product.createdBy.email,
            phone: product.createdBy.phone,
            profile_image: product.createdBy.profile_image
        };

        const productInfo = {
            _id: product._id,
            productName: product.productName,
            chemicalName: product.chemicalName,
            tradeName: product.tradeName,
            productImages: product.productImages || [],
            price: product.price,
            description: product.description
        };

        res.status(200).json({
            success: true,
            message: "Seller information retrieved successfully",
            data: {
                seller: sellerInfo,
                product: productInfo
            }
        });

    } catch (error) {
        console.error("Error fetching seller info:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch seller information",
            error: {
                code: "FETCH_ERROR",
                details: error.message
            }
        });
    }
});

// Get chat messages between buyer and seller for a specific product
productChatRouter.get('/messages/:productId', authenticateUser, async (req, res) => {
    try {
        const { productId } = req.params;
        const buyerId = req.user.id;
        const { page = 1, limit = 50 } = req.query;

        // Validate productId format
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        // Get the product and seller info
        const product = await Product.findById(productId)
            .populate('createdBy', '_id');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const sellerId = product.createdBy._id;

        // Check if buyer is trying to chat with themselves
        if (sellerId.toString() === buyerId.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot chat with yourself"
            });
        }

        // Get messages between buyer and seller with product context
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { senderId: buyerId.toString(), receiverId: sellerId.toString() },
                        { senderId: sellerId.toString(), receiverId: buyerId.toString() }
                    ]
                },
                { productId: productId } // Filter by product context
            ]
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));

        // Fetch user info for all unique senderIds and receiverIds
        const userIds = Array.from(new Set([
            ...messages.map(m => m.senderId.toString()),
            ...messages.map(m => m.receiverId.toString())
        ]));
        const users = await User.find({ _id: { $in: userIds } }, 'firstName lastName company profile_image');
        const userMap = {};
        users.forEach(u => {
            userMap[u._id.toString()] = u;
        });

        // Format messages
        const formattedMessages = messages.map(msg => {
            const sender = userMap[msg.senderId.toString()] || {};
            return {
                _id: msg._id,
                message: msg.message,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                senderName: sender.firstName && sender.lastName ? `${sender.firstName} ${sender.lastName}` : '',
                senderCompany: sender.company || '',
                senderImage: sender.profile_image || '',
                isFromBuyer: msg.senderId.toString() === buyerId.toString(),
                isRead: msg.isRead,
                createdAt: msg.createdAt,
                productId: msg.productId
            };
        });

        // Mark messages from seller as read
        await Message.updateMany({
            senderId: sellerId.toString(),
            receiverId: buyerId.toString(),
            productId: productId,
            isRead: false
        }, { isRead: true });

        res.status(200).json({
            success: true,
            message: "Chat messages retrieved successfully",
            data: {
                messages: formattedMessages,
                pagination: {
                    total: totalMessages,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalMessages / parseInt(limit))
                },
                participants: {
                    buyerId: buyerId.toString(),
                    sellerId: sellerId.toString(),
                    productId
                }
            }
        });

    } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch chat messages",
            error: {
                code: "FETCH_ERROR",
                details: error.message
            }
        });
    }
});

// Send a message from buyer to seller for a specific product
productChatRouter.post('/send-message/:productId', authenticateUser, async (req, res) => {
    try {
        const { productId } = req.params;
        const { message } = req.body;
        const senderId = req.user.id;

        // Validate inputs
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Message content is required"
            });
        }

        // Get the product and seller info
        const product = await Product.findById(productId)
            .populate('createdBy', '_id firstName lastName');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const receiverId = product.createdBy._id;

        // Check if buyer is trying to chat with themselves
        if (receiverId.toString() === senderId.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot send a message to yourself"
            });
        }

        // Create and save the message
        const newMessage = new Message({
            senderId: senderId.toString(),
            receiverId: receiverId.toString(),
            message: message.trim(),
            productId: productId,
            messageType: 'text',
            createdAt: new Date()
        });

        await newMessage.save();

        // Populate the saved message for response
        await newMessage.populate('senderId', 'firstName lastName company profile_image');
        await newMessage.populate('receiverId', 'firstName lastName company profile_image');

        // Format response
        const formattedMessage = {
            _id: newMessage._id,
            message: newMessage.message,
            senderId: newMessage.senderId._id,
            receiverId: newMessage.receiverId._id,
            senderName: `${newMessage.senderId.firstName} ${newMessage.senderId.lastName}`,
            senderCompany: newMessage.senderId.company,
            senderImage: newMessage.senderId.profile_image,
            isFromBuyer: true,
            isRead: newMessage.isRead,
            createdAt: newMessage.createdAt,
            productId: newMessage.productId
        };

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: formattedMessage
        });

        // Note: Socket emission will be handled in socket.js with the enhanced message structure

    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: {
                code: "SEND_ERROR",
                details: error.message
            }
        });
    }
});

// Get all product-based conversations for a buyer
productChatRouter.get('/conversations', authenticateUser, async (req, res) => {
    try {
        const buyerId = req.user.id;

        // Get all unique product conversations for this buyer
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: buyerId.toString() },
                        { receiverId: buyerId.toString() }
                    ],
                    productId: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: "$productId",
                    lastMessage: { $last: "$$ROOT" },
                    messageCount: { $sum: 1 },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiverId", buyerId.toString()] },
                                        { $eq: ["$isRead", false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { "lastMessage.createdAt": -1 }
            }
        ]);

        // Populate product and seller details
        const formattedConversations = [];
        
        for (const conv of conversations) {
            const product = await Product.findById(conv._id)
                .populate('createdBy', 'firstName lastName company profile_image');
            
            if (product && product.createdBy) {
                // Determine who is the other participant (seller)
                const sellerId = product.createdBy._id.toString();
                const isSellerConversation = sellerId !== buyerId.toString();
                
                if (isSellerConversation) {
                    formattedConversations.push({
                        productId: product._id,
                        seller: {
                            _id: product.createdBy._id,
                            name: `${product.createdBy.firstName} ${product.createdBy.lastName}`,
                            company: product.createdBy.company,
                            profile_image: product.createdBy.profile_image
                        },
                        product: {
                            _id: product._id,
                            productName: product.productName,
                            chemicalName: product.chemicalName,
                            productImages: product.productImages || [],
                            price: product.price
                        },
                        messageCount: conv.messageCount,
                        unreadCount: conv.unreadCount,
                        lastMessage: conv.lastMessage ? {
                            message: conv.lastMessage.message,
                            createdAt: conv.lastMessage.createdAt,
                            isFromBuyer: conv.lastMessage.senderId === buyerId.toString()
                        } : null
                    });
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Product conversations retrieved successfully",
            data: formattedConversations
        });

    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch conversations",
            error: {
                code: "FETCH_ERROR",
                details: error.message
            }
        });
    }
});

export default productChatRouter;
