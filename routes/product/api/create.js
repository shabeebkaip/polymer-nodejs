import express from "express";
import Product from "../../../models/product.js";
import ChemicalFamily from '../../../models/chemicalFamily.js';
import PhysicalForm from '../../../models/physicalForm.js';
import PolymerType from '../../../models/polymerType.js';
import {authenticateUser,authorizeRoles} from '../../../middlewares/verify.token.js'

const productCreate = express.Router();

productCreate.post("/", authenticateUser, authorizeRoles("seller", "superAdmin"),
  async (req, res) => {
    try {
      let productData = {
        ...req.body,
        createdBy: req.user.id,
      };

      // Handle "Other" for chemicalFamily
      if (req.body.chemicalFamilyOther) {
        let chemicalFamily = await ChemicalFamily.findOne({ name: req.body.chemicalFamilyOther });
        if (!chemicalFamily) {
          chemicalFamily = await ChemicalFamily.create({ name: req.body.chemicalFamilyOther });
        }
        productData.chemicalFamily = chemicalFamily._id;
      }
      // Handle "Other" for physicalForm
      if (req.body.physicalFormOther) {
        let physicalForm = await PhysicalForm.findOne({ name: req.body.physicalFormOther });
        if (!physicalForm) {
          physicalForm = await PhysicalForm.create({ name: req.body.physicalFormOther });
        }
        productData.physicalForm = physicalForm._id;
      }
      // Handle "Other" for polymerType
      if (req.body.polymerTypeOther) {
        let polymerType = await PolymerType.findOne({ name: req.body.polymerTypeOther });
        if (!polymerType) {
          polymerType = await PolymerType.create({ name: req.body.polymerTypeOther });
        }
        productData.polymerType = polymerType._id;
      }

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
