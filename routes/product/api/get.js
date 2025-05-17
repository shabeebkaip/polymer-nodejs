import express from "express";
import Product from "../../../models/product.js";
import { ObjectId } from "mongodb"; 
import { productAggregation } from "../aggregation/product.aggregation.js";

const productGet = express.Router();

productGet.post("/", async (req, res) => {
  try {
    const matchStage = buildMatchStage(req.body);
    const page = Number(req.body.page) || 1;
    const limit = Number(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: matchStage },
      ...productAggregation(),
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
    

    const countPipeline = [
      { $match: matchStage },
      { $count: "total" }
    ];

    const [products, totalCountResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline)
    ]);

    const total = totalCountResult[0]?.total || 0;

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Error fetching filtered products:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


const buildMatchStage = (filters) => {
  const matchStage = {};

  if (filters.search) {
    const searchTerm = filters.search; 
    if (searchTerm) {
      matchStage.productName = { $regex: searchTerm, $options: "i" };  
    }
  }

  if (filters.chemicalFamily?.length) {
    matchStage.chemicalFamily = { $in: filters.chemicalFamily.map(id => new ObjectId(id)) };
  }

  if (filters.polymerType?.length) {
    matchStage.polymerType = { $in: filters.polymerType.map(id => new ObjectId(id)) };
  }

  if (filters.industry?.length) {
    matchStage.industry = { $in: filters.industry.map(id => new ObjectId(id)) };
  }

  if (filters.grade?.length) {
    matchStage.grade = { $in: filters.grade.map(id => new ObjectId(id)) };
  }

  if (filters.physicalForm?.length) {
    matchStage.physicalForm = { $in: filters.physicalForm.map(id => new ObjectId(id)) };
  }

  if (filters.countryOfOrigin?.length) {
    matchStage.countryOfOrigin = { $in: filters.countryOfOrigin };
  }

  if (filters.uom?.length) {
    matchStage.uom = { $in: filters.uom };
  }

  if (filters.priceTerms) {
    matchStage.priceTerms = filters.priceTerms;
  }

  if (filters.incoterms?.length) {
    matchStage.incoterms = { $in: filters.incoterms.map(id => new ObjectId(id)) };
  }

  if (filters.paymentTerms?.length) {
    matchStage.paymentTerms = { $in: filters.paymentTerms.map(id => new ObjectId(id)) };
  }

  if (filters.packagingType?.length) {
    matchStage.packagingType = { $in: filters.packagingType.map(id => new ObjectId(id)) };
  }

  if (filters.recyclable !== undefined) {
    matchStage.recyclable = filters.recyclable;
  }

  if (filters.bioDegradable !== undefined) {
    matchStage.bioDegradable = filters.bioDegradable;
  }

  if (filters.fdaApproved !== undefined) {
    matchStage.fdaApproved = filters.fdaApproved;
  }

  if (filters.medicalGrade !== undefined) {
    matchStage.medicalGrade = filters.medicalGrade;
  }

  if (filters.createdBy?.length) {
    matchStage.createdBy = { $in: filters.createdBy.map(id => new ObjectId(id)) };
  }
  if(filters.product_family?.length) {
    matchStage.product_family = { $in: filters.product_family.map(id => new ObjectId(id)) };
  }

  return matchStage;
};

export default productGet;
