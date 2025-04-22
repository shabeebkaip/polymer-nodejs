import mongoose from "mongoose";
import Product from "../../../models/product.js";

export const getProductAgg = async (parsedQuery, page = 1, limit = 10) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * limit;

  const { id, createdBy } = parsedQuery;

  const searchQuery = mongoose.Types.ObjectId.isValid(id)
    ? { _id: new mongoose.Types.ObjectId(id) }
    : {
        ...(parsedQuery.search
          ? {
              $or: [
                { name: { $regex: parsedQuery.search, $options: "i" } },
                { description: { $regex: parsedQuery.search, $options: "i" } },
                { uom: { $regex: parsedQuery.search, $options: "i" } },
              ],
            }
          : {}),
      };

  const baseAggregation = [
    // Lookup for brand (single reference)
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

    // Lookup for industry (array reference)
    {
      $lookup: {
        from: "industries",
        localField: "industry",
        foreignField: "_id",
        as: "industries",
      },
    },

    // Lookup for appearance (array reference)
    {
      $lookup: {
        from: "appearances",
        localField: "appearance",
        foreignField: "_id",
        as: "appearances",
      },
    },

    // Lookup for substance (array reference)
    {
      $lookup: {
        from: "substances",
        localField: "substance",
        foreignField: "_id",
        as: "substances",
      },
    },

    // Lookup for grade (array reference)
    {
      $lookup: {
        from: "grades",
        localField: "grade",
        foreignField: "_id",
        as: "grades",
      },
    },

    // Lookup for incoterms (array reference)
    {
      $lookup: {
        from: "incoterms",
        localField: "incoterms",
        foreignField: "_id",
        as: "incoterms",
      },
    },

    // Lookup for product_family (array reference)
    {
      $lookup: {
        from: "productfamilies",
        localField: "product_family",
        foreignField: "_id",
        as: "productFamilies",
      },
    },
  ];

  const aggregation = [
    ...baseAggregation,
    {
      $match: {
        ...(createdBy
          ? { createdBy: new mongoose.Types.ObjectId(createdBy) }
          : {}),
        ...searchQuery,
        // Add filters for array fields if needed
        ...(parsedQuery.brandName?.length
          ? { "brand.name": { $in: parsedQuery.brandName } }
          : {}),
        ...(parsedQuery.industryName?.length
          ? { "industries.name": { $in: parsedQuery.industryName } }
          : {}),
        ...(parsedQuery.appearanceName?.length
          ? { "appearances.name": { $in: parsedQuery.appearanceName } }
          : {}),
        // Add similar filters for other array fields as needed
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        // Basic Info
        _id: 1,
        name: 1,
        description: 1,
        image: 1,
        uom: 1,
        stock: 1,
        price: 1,
        minimum_order_quantity: 1,
        safety_data_sheet: 1,
        technical_data_sheet: 1,
        min_purity: 1,
        createdAt: 1,
        updatedAt: 1,

        // References
        brand: "$brand",
        createdBy: 1,

        // Array references (mapped to names for easier consumption)
        industries: {
          $map: {
            input: "$industries",
            as: "industry",
            in: "$$industry",
          },
        },
        appearances: {
          $map: {
            input: "$appearances",
            as: "appearance",
            in: "$$appearance",
          },
        },
        substances: {
          $map: {
            input: "$substances",
            as: "substance",
            in: "$$substance",
          },
        },
        grades: {
          $map: {
            input: "$grades",
            as: "grade",
            in: "$$grade",
          },
        },
        incoterms: {
          $map: {
            input: "$incoterms",
            as: "incoterm",
            in: "$$incoterm",
          },
        },
        productFamilies: {
          $map: {
            input: "$productFamilies",
            as: "family",
            in: "$$family",
          },
        },
      },
    },
  ];

  const countAggregation = [
    ...baseAggregation,
    {
      $match: {
        ...(createdBy
          ? { createdBy: new mongoose.Types.ObjectId(createdBy) }
          : {}),
        ...searchQuery,
        // Same filters as in the main aggregation
        ...(parsedQuery.brandName?.length
          ? { "brand.name": { $in: parsedQuery.brandName } }
          : {}),
        ...(parsedQuery.industryName?.length
          ? { "industries.name": { $in: parsedQuery.industryName } }
          : {}),
      },
    },
    { $count: "totalCount" },
  ];

  const [products, countResult] = await Promise.all([
    Product.aggregate(aggregation),
    Product.aggregate(countAggregation),
  ]);

  const totalProducts = countResult.length > 0 ? countResult[0].totalCount : 0;

  return { products, totalProducts };
};
