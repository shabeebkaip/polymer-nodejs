import express from "express";
import Brand from "../../../models/brand.js";
import { getEnquiryAgg } from "../../enquiry/aggregation/enquiry.agg.js";

const brandGet = express.Router();

brandGet.post("", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.body;
    const currentPage = parseInt(page);
    const pageSize = parseInt(limit);

    const total = await Brand.countDocuments({});

    const brands = await Brand.find()
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize)
      .exec();
    const result = {
      tableHeader: [
        { name: "name", displayName: "Name" },
        {name:"owner",displayName:"Owner"},
        { name: "description", displayName: "Description" },
        { name: "image", displayName: "Image" },
        { name: "mail", displayName: "Mail" },
        { name: "phone", displayName: "Phone" },
        { name: "edit", displayName: "" },
        { name: "delete", displayName: "" },
      ],
      components: [
        { name: "name", displayName: "Category", component: "text" },
        { name: "owner", displayName: "Owner", component: "text" },
        { name: "description", displayName: "Description", component: "text" },
        { name: "image", displayName: "Image", component: "image" },
        { name: "mail", displayName: "Mail", component: "text" },
        { name: "phone", displayName: "Phone", component: "text" },
        { name: "edit", displayName: "Edit", component: "action" },
        { name: "delete", displayName: "Delete", component: "action" },
      ],
      data: [],
    };
    const tools = [
      {
        name: "create",
        displayName: "ADD BRAND",
        icon: "create.svg",
        bgColor: "#0D47A1",
        txtColor: "#FFFFFF",
      },
    ];

    if (brands.length > 0) {
      brands.forEach((brand) => {
        const row = {
          id: brand._id,
          name: brand.name,
          owner: brand.owner,
          description: brand.description,
          image: brand.logo,
          mail: brand.mail,
          phone: brand.phone,
          edit: { name: "edit", icon: "edit.svg", displayName: "Edit", id: brand._id },
          delete: { name: "delete", icon: "delete.svg", displayName: "Delete", id: brand._id },
        };
        result.data.push(row);
      });
      result.totalPages = Math.ceil(total / pageSize);
      result.currentPage = currentPage;

      res.status(200).send({ status: true, result, tools });
    }else{
      res.status(200).send({ status: false, message: "No brand found", tools });
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
});

export default brandGet;
