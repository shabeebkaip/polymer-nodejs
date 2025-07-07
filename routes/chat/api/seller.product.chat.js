import express from 'express';
import mongoose from 'mongoose';
import { authenticateUser } from '../../../middlewares/verify.token.js';
import Message from '../../../models/message.js';
import User from '../../../models/user.js';
import Product from '../../../models/product.js';

const sellerProductChatRouter = express.Router();

// Get all product-based conversations for a seller
sellerProductChatRouter.get('/conversations', authenticateUser, async (req, res) => {
    try {
        const sellerId = req.user.id;

        // Get all products created by this seller
        const sellerProducts = await Product.find({ createdBy: sellerId }).select('_id');
        const productIds = sellerProducts.map(p => p._id.toString());

        if (productIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No product conversations found",
                data: []
            });
        }

        // Get all unique conversations for seller's products
        const conversations = await Message.aggregate([
            {
                $match: {
                    productId: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) },
                    $or: [
                        { senderId: sellerId.toString() },
                        { receiverId: sellerId.toString() }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        productId: "$productId",
                        buyerId: {
                            $cond: [
                                { $eq: ["$senderId", sellerId.toString()] },
                                "$receiverId",
                                "$senderId"
                            ]
                        }
                    },
                    lastMessage: { $last: "$$ROOT" },
                    messageCount: { $sum: 1 },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiverId", sellerId.toString()] },
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

        // Populate product and buyer details
        const formattedConversations = [];
        
        for (const conv of conversations) {
            const product = await Product.findById(conv._id.productId);
            const buyer = await User.findById(conv._id.buyerId)
                .select('firstName lastName company email profile_image');
            
            if (product && buyer) {
                formattedConversations.push({
                    productId: product._id,
                    buyer: {
                        _id: buyer._id,
                        name: `${buyer.firstName} ${buyer.lastName}`,
                        company: buyer.company,
                        email: buyer.email,
                        profile_image: buyer.profile_image
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
                        isFromSeller: conv.lastMessage.senderId === sellerId.toString()
                    } : null
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Seller product conversations retrieved successfully",
            data: formattedConversations
        });

    } catch (error) {
        console.error("Error fetching seller conversations:", error);
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

// Get messages for a specific product conversation
sellerProductChatRouter.get('/messages/:productId/:buyerId', authenticateUser, async (req, res) => {
    try {
        const { productId, buyerId } = req.params;
        const sellerId = req.user.id;
        const { page = 1, limit = 50 } = req.query;

        // Validate IDs format
        if (!productId.match(/^[0-9a-fA-F]{24}$/) || !buyerId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product or buyer ID format"
            });
        }

        // Verify seller owns the product
        const product = await Product.findOne({
            _id: productId,
            createdBy: sellerId
        });

        if (!product) {
            return res.status(403).json({
                success: false,
                message: "You don't have access to this product conversation"
            });
        }

        // Get messages between seller and buyer for this product
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { senderId: sellerId.toString(), receiverId: buyerId.toString() },
                        { senderId: buyerId.toString(), receiverId: sellerId.toString() }
                    ]
                },
                { productId: productId }
            ]
        })
        .populate('senderId', 'firstName lastName company profile_image')
        .populate('receiverId', 'firstName lastName company profile_image')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));

        // Get total count for pagination
        const totalMessages = await Message.countDocuments({
            $and: [
                {
                    $or: [
                        { senderId: sellerId.toString(), receiverId: buyerId.toString() },
                        { senderId: buyerId.toString(), receiverId: sellerId.toString() }
                    ]
                },
                { productId: productId }
            ]
        });

        // Format messages
        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            message: msg.message,
            senderId: msg.senderId._id,
            receiverId: msg.receiverId._id,
            senderName: `${msg.senderId.firstName} ${msg.senderId.lastName}`,
            senderCompany: msg.senderId.company,
            senderImage: msg.senderId.profile_image,
            isFromSeller: msg.senderId._id.toString() === sellerId.toString(),
            isRead: msg.isRead,
            createdAt: msg.createdAt,
            productId: msg.productId
        }));

        // Mark messages from buyer as read
        await Message.updateMany({
            senderId: buyerId.toString(),
            receiverId: sellerId.toString(),
            productId: productId,
            isRead: false
        }, { isRead: true });

        res.status(200).json({
            success: true,
            message: "Product chat messages retrieved successfully",
            data: {
                messages: formattedMessages,
                pagination: {
                    total: totalMessages,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalMessages / parseInt(limit))
                },
                participants: {
                    sellerId: sellerId.toString(),
                    buyerId: buyerId.toString(),
                    productId
                }
            }
        });

    } catch (error) {
        console.error("Error fetching seller chat messages:", error);
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

// Send a message from seller to buyer for a specific product
sellerProductChatRouter.post('/send-message/:productId/:buyerId', authenticateUser, async (req, res) => {
    try {
        const { productId, buyerId } = req.params;
        const { message } = req.body;
        const sellerId = req.user.id;

        // Validate inputs
        if (!productId.match(/^[0-9a-fA-F]{24}$/) || !buyerId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product or buyer ID format"
            });
        }

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Message content is required"
            });
        }

        // Verify seller owns the product
        const product = await Product.findOne({
            _id: productId,
            createdBy: sellerId
        });

        if (!product) {
            return res.status(403).json({
                success: false,
                message: "You don't have access to this product conversation"
            });
        }

        // Create and save the message
        const newMessage = new Message({
            senderId: sellerId.toString(),
            receiverId: buyerId.toString(),
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
            isFromSeller: true,
            isRead: newMessage.isRead,
            createdAt: newMessage.createdAt,
            productId: newMessage.productId
        };

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: formattedMessage
        });

    } catch (error) {
        console.error("Error sending seller message:", error);
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

export default sellerProductChatRouter;
