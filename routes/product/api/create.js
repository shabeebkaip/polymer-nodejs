import express from "express";
import Product from "../../../models/product.js";
import {authenticateUser,authorizeRoles} from '../../../middlewares/verify.token.js'

const productCreate = express.Router();

productCreate.post("/",authenticateUser,authorizeRoles("seller", "superadmin"),
  async (req, res) => {
    try {
      const productData = {
        ...req.body,
        createdBy: req.user.id,
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
            company: req.user.company,
            website: req.user.website,
            phone: req.user.phone,
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
