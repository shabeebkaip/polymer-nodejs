import express from "express";
import Product from "../../../models/product.js";

const productGet = express.Router();

productGet.get("", async (req, res) => {
  try {
    const { page = 1, limit = 10, name } = req.query;
    const query = name ? { name: { $regex: name, $options: "i" } } : {};
    const products = await Product.find(query)
      .populate("brand", "name")
      .populate("category", "name")
      .populate("subCategory", "name")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

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
