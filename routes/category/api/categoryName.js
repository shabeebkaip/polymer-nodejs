import express from "express";
import Category from "../../../models/category.js";

const categoryName = express.Router();

categoryName.get("", async (req, res) => {
    try {
        const categories = await Category.find({}).select("name _id");
        res.status(200).json({
            status: true,
            categories,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
});

export default categoryName;
