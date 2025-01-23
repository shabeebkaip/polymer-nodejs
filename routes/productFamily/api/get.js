import express from "express";
import productFamily from "../../../models/productFamily.js";

const productFamilyGet = express.Router();

productFamilyGet.post('', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.body;  
        const currentPage = parseInt(page);
        const pageSize = parseInt(limit);
    
        const totalProductFamily = await productFamily.countDocuments({});
        const products = await productFamily.find({})
          .skip((currentPage - 1) * pageSize)
          .limit(pageSize);
        

        const result = {
            tableHeader: [
                { name: 'name', displayName: "Product Family" },
                { name: "image", displayName: "Image" },
                { name: "edit", displayName: "" },
                { name: "delete", displayName: "" },
            ],
            components: [
                { name: "name", displayName: "Category", component: "text" },
                { name: "image", displayName: "Icon", component: "image" },
                { name: "edit", displayName: "Edit", component: "action" },
                { name: "delete", displayName: "Delete", component: "action" },
            ],
            data: []
        };

        const tools = [
            {
                name: "create",
                displayName: "ADD PRODUCT FAMILY",
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
                    image: product.image,
                    edit: { name: "edit", icon: "edit.svg", displayName: "Edit", id: product._id },
                    delete: { name: "delete", icon: "delete.svg", displayName: "Delete", id: product._id }
                };
                result.data.push(row);
            });
            result.totalPages = Math.ceil(totalProductFamily / pageSize);
            result.currentPage = currentPage;
            res.status(200).send({ status: true, result, tools });
        } else {
            res.status(200).send({ status: false, message: 'No data' ,tools});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
});

export default productFamilyGet;
