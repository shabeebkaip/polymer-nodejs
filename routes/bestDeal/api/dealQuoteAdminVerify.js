// import express from "express";
// import DealQuoteRequest from "../../../models/dealQuoteRequest.js";
// import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

// const verifyDealQuote = express.Router();

// verifyDealQuote.patch(
//   "/:id",
//   authenticateUser,
//   authorizeRoles("superAdmin"),
//   async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { status, adminNote } = req.body;

//       if (!["approved", "rejected"].includes(status)) {
//         return res.status(400).json({ success: false, message: "Invalid status. Must be 'approved' or 'rejected'" });
//       }

//       const quote = await DealQuoteRequest.findById(id);
//       if (!quote) {
//         return res.status(404).json({ success: false, message: "Quote request not found" });
//       }

//       quote.status = status;
//       quote.adminNote = adminNote || "";
//       await quote.save();

//       res.status(200).json({
//         success: true, 
//         message: `Quote request ${status} successfully`,
//         data: quote,
//       });
//     } catch (err) {
//       console.error("Admin quote verify error:", err);
//       res.status(500).json({ success: false, error: err.message });
//     }
//   }
// );

// export default verifyDealQuote;
