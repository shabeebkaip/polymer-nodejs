import express from "express";
import Enquiry from "../../../models/enquiry.js";
import { getEnquiryAgg } from "../../enquiry/aggregation/enquiry.agg.js";

const enquiryPost = express.Router();

enquiryPost.post("", async (req, res) => {
  try {
    const body = req.body || {};
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const sellerId = body.sellerId || null;
    const { enquiries,totalEnquiries } = await getEnquiryAgg({ sellerId, page, limit });

    const result = {
      tableHeader: [
        { name: "product", displayName: "Product" },
        { name: "customer", displayName: "Customer" },
        { name: "seller", displayName: "Seller" },
        { name: "email", displayName: "Email" },
        { name: "phone", displayName: "Phone" },
        { name: "message", displayName: "Message" },
        { name: "quantity", displayName: "Quantity" },
        { name: "uom", displayName: "UOM" },
      ],
      components: [
        { name: "product", displayName: "Product", component: "text" },
        { name: "customer", displayName: "Customer", component: "text" },
        { name: "seller", displayName: "Seller", component: "text" },
        { name: "email", displayName: "Email", component: "text" },
        { name: "phone", displayName: "Phone", component: "text" },
        { name: "message", displayName: "Message", component: "text" },
        { name: "quantity", displayName: "Quantity", component: "text" },
        { name: "uom", displayName: "UOM", component: "text" },
      ],
      data: [],
    };

    if (enquiries.length > 0) {
      enquiries.forEach((enquiry) => {
        const row = {
          id: enquiry._id,
          product: enquiry.product,
          customer: enquiry.custumer,
          seller: enquiry.seller,
          email: enquiry.custumerMail,
          phone: enquiry.custumerPhone,
          message: enquiry.message,
          quantity: enquiry.quantity,
          uom: enquiry.uom,
        };
        result.data.push(row);
      });

      result.totalPages = Math.ceil(totalEnquiries / limit);
      result.currentPage = page;

      res.status(200).send({ status: true, result });
    } else {
      res.status(200).send({ status: false, message: "No data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

export default enquiryPost;
