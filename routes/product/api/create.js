import express from "express";
import Product from "../../../models/product.js";
import jwt from "jsonwebtoken";
import {
  authenticateUser,
  authorizeRoles,
} from "../../../middlewares/verify.token.js";

const productCreate = express.Router();

productCreate.post(
  "",
  authenticateUser,
  authorizeRoles("seller", "superadmin"), // Only sellers and superadmins can create products
  async (req, res) => {
    try {
      const productData = {
        ...req.body,
        createdBy: req.user.id, // Automatically set the creator
      };

      const product = new Product(productData);
      await product.save();

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: {
          ...product.toObject(),
          creator: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
          },
        },
      });
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

export default productCreate;
