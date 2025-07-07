import express from 'express';
import { authenticateUser } from '../../../middlewares/verify.token.js';
import Message from '../../../models/message.js';
import User from '../../../models/user.js';
import UnifiedQuoteRequest from '../../../models/unifiedQuoteRequest.js';

const buyerSellerChatRouter = express.Router();

// Get seller info for a specific quote request
buyerSellerChatRouter.get('/seller-info/:quoteId', authenticateUser, async (req, res) => {
    try {
        const { quoteId } = req.params;
        const buyerId = req.user.id;

        // Validate quoteId format
        if (!quoteId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote request ID format"
            });
        }

        // Find the quote request and verify ownership
        const quoteRequest = await UnifiedQuoteRequest.findOne({
            _id: quoteId,
            buyerId: buyerId
        }).populate({
            path: 'product',
            select: 'createdBy productName',
            populate: {
                path: 'createdBy',
                select: 'firstName lastName company email phone profile_image'
            }
        }).populate({
            path: 'bestDealId',
            select: 'productId',
            populate: {
                path: 'productId',
                select: 'createdBy productName',
                populate: {
                    path: 'createdBy',
                    select: 'firstName lastName company email phone profile_image'
                }
            }
        });

        if (!quoteRequest) {
            return res.status(404).json({
                success: false,
                message: "Quote request not found or you don't have access"
            });
        }

        let sellerInfo = null;

        // Get seller info based on quote type
        if (quoteRequest.requestType === 'product_quote' && quoteRequest.product?.createdBy) {
            sellerInfo = {
                _id: quoteRequest.product.createdBy._id,
                name: `${quoteRequest.product.createdBy.firstName} ${quoteRequest.product.createdBy.lastName}`,
                firstName: quoteRequest.product.createdBy.firstName,
                lastName: quoteRequest.product.createdBy.lastName,
                company: quoteRequest.product.createdBy.company,
                email: quoteRequest.product.createdBy.email,
                phone: quoteRequest.product.createdBy.phone,
                profile_image: quoteRequest.product.createdBy.profile_image,
                productName: quoteRequest.product.productName
            };
        } else if (quoteRequest.requestType === 'deal_quote' && quoteRequest.bestDealId?.productId?.createdBy) {
            sellerInfo = {
                _id: quoteRequest.bestDealId.productId.createdBy._id,
                name: `${quoteRequest.bestDealId.productId.createdBy.firstName} ${quoteRequest.bestDealId.productId.createdBy.lastName}`,
                firstName: quoteRequest.bestDealId.productId.createdBy.firstName,
                lastName: quoteRequest.bestDealId.productId.createdBy.lastName,
                company: quoteRequest.bestDealId.productId.createdBy.company,
                email: quoteRequest.bestDealId.productId.createdBy.email,
                phone: quoteRequest.bestDealId.productId.createdBy.phone,
                profile_image: quoteRequest.bestDealId.productId.createdBy.profile_image,
                productName: quoteRequest.bestDealId.productId.productName
            };
        }

        if (!sellerInfo) {
            return res.status(404).json({
                success: false,
                message: "Seller information not found for this quote"
            });
        }

        res.status(200).json({
            success: true,
            message: "Seller information retrieved successfully",
            data: {
                seller: sellerInfo,
                quote: {
                    _id: quoteRequest._id,
                    requestType: quoteRequest.requestType,
                    status: quoteRequest.status,
                    createdAt: quoteRequest.createdAt
                }
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

// Get chat messages between buyer and seller for a specific quote
buyerSellerChatRouter.get('/messages/:quoteId', authenticateUser, async (req, res) => {
    try {
        const { quoteId } = req.params;
        const buyerId = req.user.id;
        const { page = 1, limit = 50 } = req.query;

        // Validate quoteId format
        if (!quoteId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quote request ID format"
            });
        }

        // First get the seller ID from the quote
        const quoteRequest = await UnifiedQuoteRequest.findOne({
            _id: quoteId,
            buyerId: buyerId
        }).populate({
            path: 'product',
            select: 'createdBy',
            populate: {
                path: 'createdBy',
                select: '_id'
            }
        }).populate({
            path: 'bestDealId',
            select: 'productId',
            populate: {
                path: 'productId',
                select: 'createdBy',
                populate: {
                    path: 'createdBy',
                    select: '_id'
                }
            }
        });

        if (!quoteRequest) {
            return res.status(404).json({
                success: false,
                message: "Quote request not found or you don't have access"
            });
        }

        let sellerId = null;
        if (quoteRequest.requestType === 'product_quote' && quoteRequest.product?.createdBy) {
            sellerId = quoteRequest.product.createdBy._id;
        } else if (quoteRequest.requestType === 'deal_quote' && quoteRequest.bestDealId?.productId?.createdBy) {
            sellerId = quoteRequest.bestDealId.productId.createdBy._id;
        }

        if (!sellerId) {
            return res.status(404).json({
                success: false,
                message: "Seller not found for this quote"
            });
        }

        // Get messages between buyer and seller with quote context
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { senderId: buyerId.toString(), receiverId: sellerId.toString() },
                        { senderId: sellerId.toString(), receiverId: buyerId.toString() }
                    ]
                },
                { quoteId: quoteId } // Filter by quote context
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
                        { senderId: buyerId.toString(), receiverId: sellerId.toString() },
                        { senderId: sellerId.toString(), receiverId: buyerId.toString() }
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
            isFromBuyer: msg.senderId._id.toString() === buyerId.toString(),
            createdAt: msg.createdAt,
            quoteId: msg.quoteId
        }));

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
                    quoteId
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

// Send a message from buyer to seller for a specific quote
buyerSellerChatRouter.post('/send-message/:quoteId', authenticateUser, async (req, res) => {
    try {
        const { quoteId } = req.params;
        const { message } = req.body;
        const senderId = req.user.id;

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

        // Get the quote and seller info
        const quoteRequest = await UnifiedQuoteRequest.findOne({
            _id: quoteId,
            buyerId: senderId
        }).populate({
            path: 'product',
            select: 'createdBy',
            populate: {
                path: 'createdBy',
                select: '_id firstName lastName'
            }
        }).populate({
            path: 'bestDealId',
            select: 'productId',
            populate: {
                path: 'productId',
                select: 'createdBy',
                populate: {
                    path: 'createdBy',
                    select: '_id firstName lastName'
                }
            }
        });

        if (!quoteRequest) {
            return res.status(404).json({
                success: false,
                message: "Quote request not found or you don't have access"
            });
        }

        let receiverId = null;
        if (quoteRequest.requestType === 'product_quote' && quoteRequest.product?.createdBy) {
            receiverId = quoteRequest.product.createdBy._id;
        } else if (quoteRequest.requestType === 'deal_quote' && quoteRequest.bestDealId?.productId?.createdBy) {
            receiverId = quoteRequest.bestDealId.productId.createdBy._id;
        }

        if (!receiverId) {
            return res.status(404).json({
                success: false,
                message: "Seller not found for this quote"
            });
        }

        // Create and save the message
        const newMessage = new Message({
            senderId: senderId.toString(),
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
            isFromBuyer: true,
            createdAt: newMessage.createdAt,
            quoteId: newMessage.quoteId
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

// Get all active chat conversations for a buyer
buyerSellerChatRouter.get('/conversations', authenticateUser, async (req, res) => {
    try {
        const buyerId = req.user.id;

        // Get all quotes where this user is the buyer
        const quotes = await UnifiedQuoteRequest.find({
            buyerId: buyerId
        }).populate({
            path: 'product',
            select: 'createdBy productName',
            populate: {
                path: 'createdBy',
                select: 'firstName lastName company profile_image'
            }
        }).populate({
            path: 'bestDealId',
            select: 'productId',
            populate: {
                path: 'productId',
                select: 'createdBy productName',
                populate: {
                    path: 'createdBy',
                    select: 'firstName lastName company profile_image'
                }
            }
        }).sort({ createdAt: -1 });

        // Get conversations with message counts
        const conversations = [];
        
        for (const quote of quotes) {
            let seller = null;
            let productName = null;

            if (quote.requestType === 'product_quote' && quote.product?.createdBy) {
                seller = quote.product.createdBy;
                productName = quote.product.productName;
            } else if (quote.requestType === 'deal_quote' && quote.bestDealId?.productId?.createdBy) {
                seller = quote.bestDealId.productId.createdBy;
                productName = quote.bestDealId.productId.productName;
            }

            if (seller) {
                // Get message count for this conversation
                const messageCount = await Message.countDocuments({
                    $and: [
                        {
                            $or: [
                                { senderId: buyerId.toString(), receiverId: seller._id.toString() },
                                { senderId: seller._id.toString(), receiverId: buyerId.toString() }
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
                                { senderId: buyerId.toString(), receiverId: seller._id.toString() },
                                { senderId: seller._id.toString(), receiverId: buyerId.toString() }
                            ]
                        },
                        { quoteId: quote._id.toString() }
                    ]
                }).sort({ createdAt: -1 });

                conversations.push({
                    quoteId: quote._id,
                    seller: {
                        _id: seller._id,
                        name: `${seller.firstName} ${seller.lastName}`,
                        company: seller.company,
                        profile_image: seller.profile_image
                    },
                    quote: {
                        requestType: quote.requestType,
                        status: quote.status,
                        productName: productName,
                        createdAt: quote.createdAt
                    },
                    messageCount,
                    lastMessage: lastMessage ? {
                        message: lastMessage.message,
                        createdAt: lastMessage.createdAt,
                        isFromBuyer: lastMessage.senderId.toString() === buyerId.toString()
                    } : null
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Conversations retrieved successfully",
            data: conversations
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

export default buyerSellerChatRouter;
