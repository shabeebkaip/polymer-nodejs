import Product from "../../../models/product.js";

export const getProductAgg = async (query) => {
  const searchQuery = {
    ...(query.search ? {
      $or: [
        { product: { $regex: query.search, $options: "i" } },
        { "category.name": { $regex: query.search, $options: "i" } },
        { "brand.name": { $regex: query.search, $options: "i" } },
        { "chemicalFamily.name": { $regex: query.search, $options: "i" } },
        { "subCategory.name": { $regex: query.search, $options: "i" } },
      ],
    } : {}),
  };

  const aggregation = [
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
        localField: "chemicalFamily",
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
    {
      $project: {
        image:1,
        name: 1,
        description: 1,
        price: 1,
        brand: "$brand.name",               
        category: "$category.name",         
        chemicalFamily: "$chemicalFamily.name",  
        subCategoryNames: {
          $map: {
            input: "$subCategory",  
            as: "subcategory",  
            in: "$$subcategory.name",  
          },
        },
      },
    },
    {
      $match: {
        ...searchQuery,
        ...(query.categoryName && Array.isArray(query.categoryName) && query.categoryName.length > 0
          ? { "category": { $in: query.categoryName } }  
          : {}),
        ...(query.brandName && Array.isArray(query.brandName) && query.brandName.length > 0
          ? { "brand": { $in: query.brandName } }
          : {}),
        ...(query.chemicalFamilyName && Array.isArray(query.chemicalFamilyName) && query.chemicalFamilyName.length > 0
          ? { "chemicalFamily": { $in: query.chemicalFamilyName } }
          : {}),
        ...(query.subCategoryName && Array.isArray(query.subCategoryName) && query.subCategoryName.length > 0
          ? { "subCategory.name": { $in: query.subCategoryName } }
          : {}),
      },
    },
    { $sort: { createdAt: -1 } },
  ];

  const products = await Product.aggregate(aggregation);

  return { products };
};
