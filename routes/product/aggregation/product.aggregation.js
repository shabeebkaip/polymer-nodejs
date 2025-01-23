import Product from "../../../models/product.js";

export const getProductAgg = async (query) => {
  const searchQuery = {
    ...(query.search
      ? {
          $or: [
            { name: { $regex: query.search, $options: "i" } },
            { category: { $regex: query.search, $options: "i" } },
            { brand: { $regex: query.search, $options: "i" } },
          ],
        }
      : {}),
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
    {
      $project: {
        image: 1,
        name: 1,
        description: 1,
        price: 1,
        identification: 1,
        stock: 1,
        chemical_name: 1,
        basic_details: 1,
        CAS_number: 1,
        identification: 1,
        features: 1,
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
        ...(query.categoryName.length
          ? { category: { $in: query.categoryName } }
          : {}),
        ...(query.brandName.length ? { brand: { $in: query.brandName } } : {}),
        ...(query.chemicalFamilyName.length
          ? { chemicalFamily: { $in: query.chemicalFamilyName } }
          : {}),
        ...(query.subCategoryName.length
          ? { subCategoryNames: { $in: query.subCategoryName } }
          : {}),
      },
    },

    { $sort: { createdAt: -1 } },
  ];

  const products = await Product.aggregate(aggregation);
  return { products };
};
