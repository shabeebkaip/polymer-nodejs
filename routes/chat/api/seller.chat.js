import express from 'express';
import { authenticateUser } from '../../../middlewares/verify.token.js';
import Message from '../../../models/message.js';
import User from '../../../models/user.js';
import UnifiedQuoteRequest from '../../../models/unifiedQuoteRequest.js';

const sellerChatRouter = express.Router();

// Get all quote requests and messages for products created by this seller
sellerChatRouter.get('/conversations', authenticateUser, async (req, res) => {
    try {
        const sellerId = req.user.id;

        // Find all quote requests for products created by this seller
        const productQuotes = await UnifiedQuoteRequest.find({
            requestType: 'product_quote'
        }).populate({
            path: 'product',
            match: { createdBy: sellerId },
            select: 'productName createdBy'
        }).populate({
            path: 'buyerId',
            select: 'firstName lastName company email profile_image'
        }).sort({ createdAt: -1 });

        // Find all deal quote requests for best deals created by this seller
        const dealQuotes = await UnifiedQuoteRequest.find({
            requestType: 'deal_quote'
        }).populate({
            path: 'bestDealId',
            populate: {
                path: 'productId',
                match: { createdBy: sellerId },
                select: 'productName createdBy'
            }
        }).populate({
            path: 'buyerId',
            select: 'firstName lastName company email profile_image'
        }).sort({ createdAt: -1 });

        // Filter and format conversations
        const conversations = [];

        // Process product quotes
        for (const quote of productQuotes) {
            if (quote.product) { // Only include if product belongs to this seller
                const messageCount = await Message.countDocuments({
                    $and: [
                        {
                            $or: [
                                { senderId: sellerId.toString(), receiverId: quote.buyerId._id.toString() },
                                { senderId: quote.buyerId._id.toString(), receiverId: sellerId.toString() }
                            ]
                        },
                        { quoteId: quote._id.toString() }
                    ]
                });

                // Get last message
                const lastMessage = await Message.findOne({
                    $and: [
                        {
                            $or: [
                                { senderId: sellerId.toString(), receiverId: quote.buyerId._id.toString() },
                                { senderId: quote.buyerId._id.toString(), receiverId: sellerId.toString() }
                            ]
                        },
                        { quoteId: quote._id.toString() }
                    ]
                }).sort({ createdAt: -1 });

                // Get unread message count
                const unreadCount = await Message.countDocuments({
                    senderId: quote.buyerId._id.toString(),
                    receiverId: sellerId.toString(),
                    quoteId: quote._id.toString(),
                    isRead: false
                });

                conversations.push({
                    quoteId: quote._id,
                    buyer: {
                        _id: quote.buyerId._id,
                        name: `${quote.buyerId.firstName} ${quote.buyerId.lastName}`,
                        company: quote.buyerId.company,
                        email: quote.buyerId.email,
                        profile_image: quote.buyerId.profile_image
                    },
                    quote: {
                        requestType: quote.requestType,
                        status: quote.status,
                        productName: quote.product.productName,
                        quantity: quote.quantity,
                        destination: quote.destination,
                        createdAt: quote.createdAt
                    },
                    messageCount,
                    unreadCount,
                    lastMessage: lastMessage ? {
                        message: lastMessage.message,
                        createdAt: lastMessage.createdAt,
                        isFromSeller: lastMessage.senderId.toString() === sellerId.toString()
                    } : null
                });
            }
        }

        // Process deal quotes
        for (const quote of dealQuotes) {
            if (quote.bestDealId?.productId) { // Only include if deal product belongs to this seller
                const messageCount = await Message.countDocuments({
                    $and: [
                        {
                            $or: [
                                { senderId: sellerId.toString(), receiverId: quote.buyerId._id.toString() },
                                { senderId: quote.buyerId._id.toString(), receiverId: sellerId.toString() }
                            ]
                        },
                        { quoteId: quote._id.toString() }
                    ]
                });

                // Get last message
                const lastMessage = await Message.findOne({
                    $and: [
                        {
                            $or: [
                                { senderId: sellerId.toString(), receiverId: quote.buyerId._id.toString() },
                                { senderId: quote.buyerId._id.toString(), receiverId: sellerId.toString() }
                            ]
                        },
                        { quoteId: quote._id.toString() }
                    ]
                }).sort({ createdAt: -1 });

                // Get unread message count
                const unreadCount = await Message.countDocuments({
                    senderId: quote.buyerId._id.toString(),
                    receiverId: sellerId.toString(),
                    quoteId: quote._id.toString(),
                    isRead: false
                });

                conversations.push({
                    quoteId: quote._id,
                    buyer: {
                        _id: quote.buyerId._id,
                        name: `${quote.buyerId.firstName} ${quote.buyerId.lastName}`,
                        company: quote.buyerId.company,
                        email: quote.buyerId.email,
                        profile_image: quote.buyerId.profile_image
                    },
                    quote: {
                        requestType: quote.requestType,
                        status: quote.status,
                        productName: quote.bestDealId.productId.productName,
                        quantity: quote.desiredQuantity,
                        destination: quote.shippingCountry,
                        createdAt: quote.createdAt
                    },
                    messageCount,
                    unreadCount,
                    lastMessage: lastMessage ? {
                        message: lastMessage.message,
                        createdAt: lastMessage.createdAt,
                        isFromSeller: lastMessage.senderId.toString() === sellerId.toString()
                    } : null
                });
            }
        }

        // Sort by last message time or quote creation time
        conversations.sort((a, b) => {
            const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.quote.createdAt);
            const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.quote.createdAt);
            return bTime - aTime;
        });

        res.status(200).json({
            success: true,
            message: "Seller conversations retrieved successfully",
            data: conversations
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

// Get messages for a specific quote from seller's perspective
sellerChatRouter.get('/messages/:quoteId', authenticateUser, async (req, res) => {
    try {
        const { quoteId } = req.params;
        const sellerId = req.user.id;
        const { page = 1, limit = 50 } = req.query;

        // Validate quoteId format
        if (!quoteId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote request ID format"
            });
        }

        // Verify seller has access to this quote
        const quote = await UnifiedQuoteRequest.findById(quoteId)
            .populate({
                path: 'product',
                select: 'createdBy'
            })
            .populate({
                path: 'bestDealId',
                populate: {
                    path: 'productId',
                    select: 'createdBy'
                }
            });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote request not found"
            });
        }

        // Check if seller owns the product
        let hasAccess = false;
        let buyerId = null;

        if (quote.requestType === 'product_quote' && quote.product?.createdBy?.toString() === sellerId) {
            hasAccess = true;
            buyerId = quote.buyerId;
        } else if (quote.requestType === 'deal_quote' && quote.bestDealId?.productId?.createdBy?.toString() === sellerId) {
            hasAccess = true;
            buyerId = quote.buyerId;
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "You don't have access to this quote conversation"
            });
        }

        // Get messages between seller and buyer for this quote
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { senderId: sellerId.toString(), receiverId: buyerId.toString() },
                        { senderId: buyerId.toString(), receiverId: sellerId.toString() }
                    ]
                },
                { quoteId: quoteId }
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
                { quoteId: quoteId }
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
            quoteId: msg.quoteId
        }));

        // Mark messages from buyer as read
        await Message.updateMany({
            senderId: buyerId.toString(),
            receiverId: sellerId.toString(),
            quoteId: quoteId,
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
                    sellerId: sellerId.toString(),
                    buyerId: buyerId.toString(),
                    quoteId
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

// Send a message from seller to buyer
sellerChatRouter.post('/send-message/:quoteId', authenticateUser, async (req, res) => {
    try {
        const { quoteId } = req.params;
        const { message } = req.body;
        const sellerId = req.user.id;

        // Validate inputs
        if (!quoteId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote request ID format"
            });
        }

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Message content is required"
            });
        }

        // Verify seller has access to this quote and get buyer ID
        const quote = await UnifiedQuoteRequest.findById(quoteId)
            .populate({
                path: 'product',
                select: 'createdBy'
            })
            .populate({
                path: 'bestDealId',
                populate: {
                    path: 'productId',
                    select: 'createdBy'
                }
            });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote request not found"
            });
        }

        // Check if seller owns the product
        let hasAccess = false;
        if (quote.requestType === 'product_quote' && quote.product?.createdBy?.toString() === sellerId) {
            hasAccess = true;
        } else if (quote.requestType === 'deal_quote' && quote.bestDealId?.productId?.createdBy?.toString() === sellerId) {
            hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "You don't have access to this quote conversation"
            });
        }

        const receiverId = quote.buyerId;

        // Create and save the message
        const newMessage = new Message({
            senderId: sellerId.toString(),
            receiverId: receiverId.toString(),
            message: message.trim(),
            quoteId: quoteId,
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
            quoteId: newMessage.quoteId
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

export default sellerChatRouter;
