// import express from "express";
// import QuoteRequest from "../../../models/quoteRequest.js";

// const getApprovedQuotes = express.Router();

// getApprovedQuotes.get("/", async (req, res) => {
//   try {
//     const approvedQuotes = await QuoteRequest.find({ status: "approved" })
//       .populate("product", "productName")
//       .populate("user", "firstName lastName company")
//       .sort({ createdAt: -1 });

//     const formatted = approvedQuotes.map((quote) => {
//       const obj = quote.toObject();
//       if (obj.user) {
//         obj.user.name = `${obj.user.firstName} ${obj.user.lastName}`;
//         delete obj.user.firstName;
//         delete obj.user.lastName;
//       }
//       return obj;
//     });

//     res.status(200).json({ success: true, data: formatted });
//   } catch (err) {
//     console.error("Approved quote request fetch error:", err);
//     res.status(500).json({ error: "Failed to fetch approved quote requests" });
//   }
// });

// export default getApprovedQuotes;
