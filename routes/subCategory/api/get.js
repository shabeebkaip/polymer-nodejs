import express from "express";
import SubCategory from "../../../models/subCategory.js";

const subCategoryGet = express.Router();

subCategoryGet.get("", async (req, res) => {
  try {
    const query = req.query || {};
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const totalSubCategory = await SubCategory.countDocuments({});
    const subCategory  = await SubCategory.find({})
        .skip((page - 1) * limit)
        .limit(limit);

   
    const result = {
      tableHeader: [
        { name: "name", displayName: "Category" },
        { name: "parentCategory", displayName: "Main Category" },
        { name: "description", displayName: "Description" },
        { name: "image", displayName: "Image" },
        { name: "icon", displayName: "Icon" },
        { name: "edit", displayName: "" },
        { name: "delete", displayName: "" },
      ],

      components: [
        { name: "name", displayName: "Category", component: "text" },
        { name: "parentCategory", displayName: "Main Category", component: "text" },
        { name: "description", displayName: "Description", component: "text" },
        { name: "image", displayName: "Image", component: "image" },
        { name: "icon", displayName: "Icon", component: "image" },
        { name: "edit", displayName: "Edit", component: "action" },
        { name: "delete", displayName: "Delete", component: "action" },
      ],
      data: []
    }

    const tools = [
      {
        name: "create",
        displayName: "ADD SUB CATEGORY",
        icon: "create.svg",
        bgColor: "#0D47A1",
        txtColor: "#FFFFFF",
      },
    ]; 

    if (subCategory) {
      subCategory.forEach((subCategory) => {
        const row = {}
        row.id = subCategory._id
        row.name = subCategory.name
        row.parentCategory = subCategory.parentCategory
        row.description = subCategory.description
        row.image = subCategory.image
        row.icon = subCategory.icon
        row.edit = { name: "edit", icon: "edit.svg", displayName: "Edit", id: subCategory._id }
        row.delete = { name: "delete", icon: "delete.svg", displayName: "Delete", id: subCategory._id }
        result.data.push(row)
      })
      result.totalPages = Math.ceil(totalSubCategory / limit);
      result.currentPage = page;

      res.status(200).send({ status: true, result, tools })

    } else {
      res.status(200).send({ status: false, message: 'No data' })
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({
      status:false,
      message: "Internal server error",
    });
  }
});

export default subCategoryGet;
