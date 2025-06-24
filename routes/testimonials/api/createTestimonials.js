// import express from "express";
// import Testimonial from "../../../models/testimonials.js";
// import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

// const createTestimonial = express.Router();

// createTestimonial.post("/", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
//   try {
//     const newTestimonial = new Testimonial(req.body);
//     const saved = await newTestimonial.save();
//     res.status(201).json({ success: true, message: "Testimonial created", testimonial: saved });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// });

// export default createTestimonial;
