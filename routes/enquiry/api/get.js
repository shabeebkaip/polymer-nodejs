import express from "express";
import Enquiry from "../../../models/enquiry.js";

const enquiryGet = express.Router();

enquiryGet.get("", async (req, res) => {
  try {
    const query = req.query || {};
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const totalEnquiries = await Enquiry.countDocuments({});
    const enquiries = await Enquiry.find({})
      .skip((page - 1) * limit)
      .limit(limit);

    const result = {
      tableHeader: [
        { name: "name", displayName: "Name" },
        { name: "email", displayName: "Email" },
        { name: "phone", displayName: "Phone" },
        { name: "message", displayName: "Message" },
        { name: "market", displayName: "Market" },
        { name: "address", displayName: "Address" },
      ],
      components: [
        { name: "name", displayName: "Name", component: "text" },
        { name: "email", displayName: "Email", component: "text" },
        { name: "phone", displayName: "Phone", component: "text" },
        { name: "message", displayName: "Message", component: "text" },
        { name: "market", displayName: "Market", component: "text" },
        { name: "address", displayName: "Address", component: "text" },
      ],
      data: [],
    };

    if (enquiries.length > 0) {
      enquiries.forEach((enquiry) => {
        const row = {
          id: enquiry._id,
          name: enquiry.name,
          email: enquiry.email,
          phone: enquiry.phone,
          message: enquiry.message,
          market: enquiry.market,
          address: enquiry.address,
          existing_customer: enquiry.existing_customer,
          expected_annual_volume: enquiry.expected_annual_volume,
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

export default enquiryGet;
