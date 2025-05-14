import express from "express";

import Finance from "../../../models/finance.js";

const deleteFinanceRouter = express.Router();


deleteFinanceRouter.delete("/:id", async (req, res) => {
  try {
    const financeId = req.params.id;
    // const userId = req.user.id;


    const deletedFinance = await Finance.findOneAndDelete({ _id: financeId });

    if (!deletedFinance) {
      return res.status(404).json({ error: "Finance request not found" });
    }

    res.status(200).json({ success: true, message: "Finance request deleted successfully" });
  } catch (err) {
    console.error("Error deleting finance request:", err);
    res.status(500).json({ error: "Failed to delete finance request" });
  }
});

export default deleteFinanceRouter;
