import express from "express";
import Product from "../../../models/product.js";
import mongoose from 'mongoose';
import { productAggregation } from "../aggregation/product.aggregation.js";

const productDetail = express.Router();

productDetail.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const pipeline = productAggregation();

    pipeline.unshift({
      $match: { _id: new mongoose.Types.ObjectId(id) }
    });

    const products = await Product.aggregate(pipeline);

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = products[0];

    // Enhanced response with chat functionality
    const enhancedProduct = {
      ...product,
      // Chat functionality for frontend integration
      chatEnabled: true,
      chatInfo: {
        productId: product._id,
        sellerId: product.createdBy._id,
        sellerName: product.createdBy.name,
        sellerCompany: product.createdBy.company,
        productName: product.productName,
        // Frontend can use this to determine if user can chat with supplier
        canChat: product.createdBy._id ? true : false,
        // API endpoints for frontend integration
        endpoints: {
          getSellerInfo: `/api/chat/product/seller-info/${product._id}`,
          getMessages: `/api/chat/product/messages/${product._id}`,
          sendMessage: `/api/chat/product/send-message/${product._id}`,
          conversations: '/api/chat/product/conversations'
        },
        // Socket.IO events for real-time chat
        socketEvents: {
          joinRoom: 'joinProductChat',
          sendMessage: 'sendProductMessage',
          receiveMessage: 'receiveProductMessage',
          typing: 'typing',
          roomName: `product_${product._id}`
        }
      }
    };

    res.json({ 
      success: true, 
      data: enhancedProduct 
    });

  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

export default productDetail;
