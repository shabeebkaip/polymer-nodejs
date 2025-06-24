// import express from "express";
// import Testimonial from "../../../models/testimonials.js";
// import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

// const updateTestimonial = express.Router();

// updateTestimonial.put("/:id", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
//   try {
//     const updated = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!updated) return res.status(404).json({ success: false, message: "Testimonial not found" });

//     res.status(200).json({ success: true, message: "Testimonial updated", testimonial: updated });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// });

// export default updateTestimonial;
