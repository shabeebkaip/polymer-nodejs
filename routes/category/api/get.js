import express from "express";
import Category from "../../../models/category.js";

const categoryGet = express.Router();

categoryGet.get('', async (req, res) => {
    try {
        const query = req.query || {};
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;

        const totalCategories = await Category.countDocuments({});
        const categories = await Category.find({})
            .skip((page - 1) * limit)
            .limit(limit);

        const result = {
            tableHeader: [
                { name: "name", displayName: "Category" },
                { name: "description", displayName: "Description" },
                { name: "image", displayName: "Image" },
                { name: "icon", displayName: "Icon" },
                { name: "edit", displayName: "" },
                { name: "delete", displayName: "" },
            ],
            components: [
                { name: "name", displayName: "Category", component: "text" },
                { name: "description", displayName: "Description", component: "text" },
                { name: "image", displayName: "Image", component: "image" },
                { name: "icon", displayName: "Icon", component: "image" },
                { name: "edit", displayName: "Edit", component: "action" },
                { name: "delete", displayName: "Delete", component: "action" },
            ],
            data: [],
        };

        const tools = [
            {
                name: "create",
                displayName: "ADD CATEGORY",
                icon: "create.svg",
                bgColor: "#0D47A1",
                txtColor: "#FFFFFF",
            },
        ];

        if (categories.length > 0) {
            categories.forEach((category) => {
                const row = {};
                row.id = category._id;
                row.name = category.name;
                row.description = category.description;
                row.image = category.image;
                row.icon = category.icon;
                row.edit = { name: "edit", icon: "edit.svg", displayName: "Edit", id: category._id };
                row.delete = { name: "delete", icon: "delete.svg", displayName: "Delete", id: category._id };
                result.data.push(row);
            });

            result.totalPages = Math.ceil(totalCategories / limit);
            result.currentPage = page;

            res.status(200).send({ status: true, result, tools });
        } else {
            res.status(200).send({ status: false, message: 'No data', tools });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
});

export default categoryGet;
