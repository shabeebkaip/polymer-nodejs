// import express from 'express';
// import Product from '../../../models/product';


// const productFilter = express.Router();

// productFilter.get('', async (req, res) => {
//   try {
//     const categories = await Category.distinct("name");
//     const points = await Product.distinct("point");

//     const filter = [
//       {
//         name: "categoryName",
//         displayName: "Category Name",
//         component: "multiLookup", 
//         data: categories, 
//       },
//       {
//         name: "points",
//         displayName: "Points",
//         component: "multiLookup", 
//         data: points,
//       },
//     ];

//     res.status(200).json({ filter });
//   } catch (error) {
   
//     res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// });

// export default questionFilter;
