import Cart from '../../../models/cart.js';
import express from "express";

const cartList = express.Router();

cartList.get("/:id", async (req, res) => {
    try {
        const cart = await Cart.find({ userId: req.params.id }); 
        if (!cart || cart.length === 0) {
            return res.status(200).json({
                message: "Cart not found",
                success: true,
                statusCode: 200,
            });
        }
        res.status(200).json({
            message: "Cart fetched successfully",
            success: true,
            statusCode: 200,
            data: cart,
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            success: false,
            statusCode: 500,
        });
        console.error("Error getting cart", error);
    }
});

export default cartList;
