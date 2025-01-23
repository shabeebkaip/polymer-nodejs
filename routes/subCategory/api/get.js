import express from "express";
import SubCategory from "../../../models/subCategory.js";
import Category from "../../../models/category.js";

const subCategoryGet = express.Router();

subCategoryGet.post("", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.body;  
    const currentPage = parseInt(page);
    const pageSize = parseInt(limit);

    const totalSubCategory = await SubCategory.countDocuments({});
    const subCategories = await SubCategory.find({})
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

      const category = await Category.find({}).select("name _id");

    const result = {
      tableHeader: [
        { name: "name", displayName: "Category" },
        { name: "parentCategory", displayName: "Main Category" },
        { name: "description", displayName: "Description" },
        { name: "image", displayName: "Image" },
        { name: "icon", displayName: "Icon" },
        { name: 'more', displayName: 'More'},
      ],
      components: [
        { name: "name", displayName: "Category", component: "text" },
        { name: "parentCategory", displayName: "Main Category", component: "text" },
        { name: "description", displayName: "Description", component: "text" },
        { name: "image", displayName: "Image", component: "image" },
        { name: "icon", displayName: "Icon", component: "image" },
        { name: 'more', displayName: 'More', component: 'more' },
      ],
      data: [],
    };

    const tools = [
      {
        name: "create",
        displayName: "ADD SUB CATEGORY",
        icon: "create.svg",
        bgColor: "#0D47A1",
        txtColor: "#FFFFFF",
      },
    ];

    if (subCategories.length > 0) {
      subCategories.forEach((subCategory) => {
        const row = {
          id: subCategory._id,
          name: subCategory.name,
          parentCategory: subCategory.parentCategory,
          description: subCategory.description,
          image: subCategory.image,
          icon: subCategory.icon,
          more: [
            { name: "edit", icon: "edit.svg", displayName: "Edit", id: subCategory._id },
            { name: "delete", icon: "delete.svg", displayName: "Delete", id: subCategory._id },
    
          ]
          
        };
        result.data.push(row);
      });

      result.totalPages = Math.ceil(totalSubCategory / pageSize);
      result.currentPage = currentPage;

      res.status(200).send({ status: true, result, tools,category });
    } else {
      res.status(200).send({ status: false, message: "No data found", tools });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

export default subCategoryGet;
