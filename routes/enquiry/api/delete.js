import express from "express";
import Enquiry from "../../../models/enquiry.js";

const enquiryDelete = express.Router();

enquiryDelete.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const enquiry = await Enquiry.findByIdAndDelete(id);
    if (enquiry) {
      res.status(200).send({ status: true, message: "Enquiry deleted" });
    } else {
      res.status(200).send({ status: false, message: "Enquiry not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: error.message });
  }
});

export default enquiryDelete;
