// import express from "express";
// import Testimonial from "../../../models/testimonials.js";
// import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

// const deleteTestimonial = express.Router();

// deleteTestimonial.delete("/:id", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
//   try {
//     const deleted = await Testimonial.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.status(404).json({ success: false, message: "Testimonial not found" });

//     res.status(200).json({ success: true, message: "Testimonial deleted" });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// });

// export default deleteTestimonial;
