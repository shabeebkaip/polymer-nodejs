import express from "express";
import earlyAccessService from "../../../services/earlyAccess.service.js";
import { verifyToken } from "../../../middlewares/verify.token.js";

const deleteEarlyAccessRouter = express.Router();

// Admin only - delete early access request
deleteEarlyAccessRouter.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await earlyAccessService.deleteRequest(id);

    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error("Error deleting early access request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete request",
    });
  }
});

export default deleteEarlyAccessRouter;
