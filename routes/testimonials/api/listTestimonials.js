// import express from "express";
// import Testimonial from "../../../models/testimonials.js";

// const getTestimonials = express.Router();

// getTestimonials.get("/", async (req, res) => {
//   try {
//     const testimonials = await Testimonial.find().sort({ createdAt: -1 });
//     res.status(200).json({ success: true, testimonials });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// export default getTestimonials;
