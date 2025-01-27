import mongoose from "mongoose";
import Product from "../../../models/product.js";

export const getProductAgg = async (parsedQuery, page = 1, limit = 10,) => {
  // Ensure page is at least 1
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * limit;

  const { id } = parsedQuery;

  const searchQuery = mongoose.Types.ObjectId.isValid(id)
    ? { _id: new mongoose.Types.ObjectId(id) }
    : {
        ...(parsedQuery.search
          ? {
              $or: [
                { name: { $regex: parsedQuery.search, $options: "i" } },
                { category: { $regex: parsedQuery.search, $options: "i" } },
                { brand: { $regex: parsedQuery.search, $options: "i" } },
              ],
            }
          : {}),
      };
      
  const baseAggregation = [
    {
      $lookup: {
        from: "productfamilies",
        localField: "product_family",
        foreignField: "_id",
        as: "productFamily",
      },
    },
    { $unwind: { path: "$productFamily", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "chemicalfamilies",
        localField: "chemical_family",
        foreignField: "_id",
        as: "chemicalFamily",
      },
    },
    { $unwind: { path: "$chemicalFamily", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "subcategories",
        localField: "subCategory",
        foreignField: "_id",
        as: "subCategory",
      },
    },
  ];

  const aggregation = [
    ...baseAggregation,
    {
      $match: {
        ...searchQuery,
        ...(parsedQuery.categoryName?.length
          ? { "category.name": { $in: parsedQuery.categoryName } }
          : {}),
        ...(parsedQuery.brandName?.length
          ? { "brand.name": { $in: parsedQuery.brandName } }
          : {}),
        ...(parsedQuery.chemicalFamilyName?.length
          ? { "chemicalFamily.name": { $in: parsedQuery.chemicalFamilyName } }
          : {}),

         
        ...(parsedQuery.subCategoryName?.length
          ? {
              subCategory: {
                $elemMatch: { name: { $in: parsedQuery.subCategoryName } },
              },
            }
          : {}),
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        price: 1,
        stock: 1,
        documents: 1,
        image: 1,
        uom: 1,
        ingredient_name: 1,
        chemical_family: 1,
        chemical_name: 1,
        CAS_number: 1,
        identification: 1,
        features: 1,
        basic_details: 1,
        brand: "$brand.name",
        category: "$category.name",
        chemicalFamily: "$chemicalFamily.name",
        productFamily: "$productFamily.name",
        subCategoryNames: {
          $map: {
            input: "$subCategory",
            as: "subcategory",
            in: "$$subcategory.name",
          },
        },
      },
    },
  ];

  const countAggregation = [
    ...baseAggregation,
    {
      $match: {
        ...searchQuery,
        ...(parsedQuery.categoryName?.length
          ? { "category.name": { $in: parsedQuery.categoryName } }
          : {}),
        ...(parsedQuery.brandName?.length
          ? { "brand.name": { $in: parsedQuery.brandName } }
          : {}),
        ...(parsedQuery.chemicalFamilyName?.length
          ? { "chemicalFamily.name": { $in: parsedQuery.chemicalFamilyName } }
          : {}),
        ...(parsedQuery.subCategoryName?.length
          ? {
              subCategory: {
                $elemMatch: { name: { $in: parsedQuery.subCategoryName } },
              },
            }
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
