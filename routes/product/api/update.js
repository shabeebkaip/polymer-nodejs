import express from "express";
import Product from "../../../models/product.js";
import ChemicalFamily from '../../../models/chemicalFamily.js';
import PhysicalForm from '../../../models/physicalForm.js';
import PolymerType from '../../../models/polymerType.js';

const productUpdate = express.Router();

productUpdate.put("/:id", async (req, res) => {
  try {
    let updateData = { ...req.body };

    // Handle "Other" for chemicalFamily
    if (req.body.chemicalFamilyOther) {
      let chemicalFamily = await ChemicalFamily.findOne({ name: req.body.chemicalFamilyOther });
      if (!chemicalFamily) {
        chemicalFamily = await ChemicalFamily.create({ name: req.body.chemicalFamilyOther });
      }
      updateData.chemicalFamily = chemicalFamily._id;
    }
    // Handle "Other" for physicalForm
    if (req.body.physicalFormOther) {
      let physicalForm = await PhysicalForm.findOne({ name: req.body.physicalFormOther });
      if (!physicalForm) {
        physicalForm = await PhysicalForm.create({ name: req.body.physicalFormOther });
      }
      updateData.physicalForm = physicalForm._id;
    }
    // Handle "Other" for polymerType
    if (req.body.polymerTypeOther) {
      let polymerType = await PolymerType.findOne({ name: req.body.polymerTypeOther });
      if (!polymerType) {
        polymerType = await PolymerType.create({ name: req.body.polymerTypeOther });
      }
      updateData.polymerType = polymerType._id;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
        statusCode: 404,
      });
    }
    res.status(200).json({
      message: "Product updated successfully",
      success: true,
      status: 200,
      product: product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      status: false,
      statusCode: 500,
    });
    console.log("Error updating product", error);
  }
});

export default productUpdate;
