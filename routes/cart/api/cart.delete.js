import express from "express";
import Cart from "../../../models/cart.js";

const cartDelete = express.Router();

cartDelete.delete("/:id?", async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      const cart = await Cart.findByIdAndDelete(id);
      if (!cart) {
        return res.status(404).json({
          message: "Cart item not found",
          success: false,
          statusCode: 404,
        });
      }
      return res.status(200).json({
        message: "Cart item deleted successfully",
        success: true,
        statusCode: 200,
      });
    } else {
      await Cart.deleteMany({});
      return res.status(200).json({
        message: "All cart items deleted successfully",
        success: true,
        statusCode: 200,
      });
    }
  } catch (error) {
    console.error("Error deleting cart", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
  }
});

export default cartDelete;
