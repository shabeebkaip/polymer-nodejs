import express from "express";
import Product from "../../../models/product.js";
import { getProductAgg } from "../aggregation/product.aggregation.js";

const productGet = express.Router();

productGet.post("", async (req, res) => {
  try {
    const {
      name,
      categoryName,
      brandName,
      chemicalFamilyName,
      subCategoryName,
    } = req.body;

    const parsedQuery = {
      search: name || "",
      categoryName: Array.isArray(categoryName) ? categoryName : [],
      brandName: Array.isArray(brandName) ? brandName : [],
      chemicalFamilyName: Array.isArray(chemicalFamilyName)
        ? chemicalFamilyName
        : [],
      subCategoryName: Array.isArray(subCategoryName) ? subCategoryName : [],
    };
    const products = await getProductAgg(parsedQuery)

    const result = {
      tableHeader: [
        { name: "name", displayName: "Product Name" },
        { name: "brand", displayName: "Brand" },
        { name: "category", displayName: "Category" },
        { name: "price", displayName: "Price" },
        { name: "stock", displayName: "Stock" },
        { name: "edit", displayName: "" },
        { name: "delete", displayName: "" },
        { name: "view", displayName: "" },
      ],
      components: [
        { name: "name", displayName: "Product Name", component: "text" },
        { name: "brand", displayName: "Brand", component: "text" },
        { name: "category", displayName: "Category", component: "text" },
        { name: "price", displayName: "Price", component: "text" },
        { name: "stock", displayName: "Stock", component: "text" },
        { name: "edit", displayName: "Edit", component: "action" },
        { name: "delete", displayName: "Delete", component: "action" },
        { name: "view", displayName: "View", component: "action" },
      ],
      data: [],
      // totalPages: Math.ceil(totalProducts / limit),
      // currentPage: page,
    };

    const tools = [
      {
        name: "create",
        displayName: "ADD PRODUCT",
        icon: "create.svg",
        bgColor: "#0D47A1",
        txtColor: "#FFFFFF",
      },
    ];

    if (products.length > 0) {
      products.forEach((product) => {
        const row = {
          id: product._id,
          name: product.name,
          brand: product.brand?.name || "N/A",
          category: product.category?.name || "N/A",
          price: product.price,
          stock: product.stock,
          description:product.description,
          subCategory:product.subCategory,
          documents:product.documents,
          image:product.image,
          uom:product.uom,
          ingredient_name:product.ingredient_name,
          chemical_family:product.chemical_family,
          chemical_name:product.chemical_name,
          CAS_number:product.CAS_number,
          identification:product.identification,
          product_family:product.product_family,
          features:product.features,
          basic_details:product.basic_details,
          chemical_family:product.chemical_family,

          edit: {
            name: "edit",
            icon: "edit.svg",
            displayName: "Edit",
            id: product._id,
          },
          delete: {
            name: "delete",
            icon: "delete.svg",
            displayName: "Delete",
            id: product._id,
          },
          view: {
            name: "view",
            icon: "view.svg",
            displayName: "View",
            id: product._id,
          },
        };
        result.data.push(row);
      });

      res.status(200).json({
        status: true,
        result,
        tools,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No products found",
        tools
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

export default productGet;
