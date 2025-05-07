// import express from "express";
// import Category from "../../../models/category.js";
// import SubCategory from "../../../models/subCategory.js";
// import Brand from "../../../models/brand.js";
// import productFamily from "../../../models/productFamily.js";
// import ChemicalFamily from "../../../models/chemicalFamily.js";


// const productEntity = express.Router();

// productEntity.get("", async (req, res) => {
//     try {
//         const category = await Category.find({}).select("name _id");
//         const subCategory = await SubCategory.find({}).select("name _id");
//         const brand = await Brand.find({}).select("name _id")
//         const product = await productFamily.find({}).select("name _id")
//         const chemical = await ChemicalFamily.find({}).select("name _id")
//         res.status(200).json({
//             status: true,
//             data: {
//                 category,
//                 subCategory,
//                 brand,
//                 product,
//                 chemical
//             },
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             status: false,
//             message: "Internal server error",
//         });
//     }
// });

// export default productEntity;
