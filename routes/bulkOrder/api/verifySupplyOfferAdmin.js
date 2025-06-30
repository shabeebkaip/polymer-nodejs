// import express from "express";
// import SupplierOfferRequest from "../../../models/supplierOfferRequest.js";
// import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

// const verifySupplierOffer = express.Router();

// verifySupplierOffer.patch("/verify/:id", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, adminNote } = req.body;

//     const validStatuses = ["approved", "rejected"];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ message: "Invalid status" });
//     }

//     const offer = await SupplierOfferRequest.findByIdAndUpdate(
//       id,
//       { status, adminNote },
//       { new: true }
//     );

//     if (!offer) {
//       return res.status(404).json({ message: "Offer not found" });
//     }

//     res.status(200).json({ success: true, message: `Offer ${status} successfully`, data: offer });
//   } catch (err) {
//     console.error("Offer verify error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// export default verifySupplierOffer;
