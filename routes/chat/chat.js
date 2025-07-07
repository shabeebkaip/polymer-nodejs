
import express from 'express';
import expertListRouter from './api/expert.list.js';
import allMessagesRouter from './api/all.messages.js';
import buyerSellerChatRouter from './api/buyer.seller.chat.js';
import sellerChatRouter from './api/seller.chat.js';
import productChatRouter from './api/product.chat.js';
import sellerProductChatRouter from './api/seller.product.chat.js';

const chatRouter = express.Router()

chatRouter.use('/expert-list', expertListRouter)
chatRouter.use('/messages', allMessagesRouter)
chatRouter.use('/buyer-seller', buyerSellerChatRouter)
chatRouter.use('/seller', sellerChatRouter)
chatRouter.use('/product', productChatRouter)
chatRouter.use('/seller-product', sellerProductChatRouter)

export default chatRouter