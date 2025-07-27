import express from "express";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";
import Product from "../../../models/product.js";
import QuoteRequestHelper from "../../../utils/quoteRequestHelper.js";
import Notification from "../../../models/notification.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const updateQuoteStatus = express.Router();

updateQuoteStatus.patch(
  "/:id",
  authenticateUser,
  authorizeRoles("seller"), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, message, adminNote } = req.body;
      const sellerId = req.user.id;

      // Validate ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid quote request ID format",
          error: {
            code: "INVALID_ID",
            details: "Please provide a valid quote request ID"
          }
        });
      }

      // Updated allowed statuses for unified schema
      const allowedStatuses = [
        "pending", "responded", "negotiation", "accepted", 
        "in_progress", "shipped", "delivered", "completed", 
        "rejected", "cancelled", "approved"
      ];
      
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status value provided.",
          error: {
            code: "INVALID_STATUS",
            details: `Status must be one of: ${allowedStatuses.join(", ")}`,
            allowedStatuses
          }
        });
      }

      // Find all products owned by this seller
      const sellerProducts = await Product.find({ createdBy: sellerId }).select("_id");
      const productIds = sellerProducts.map(p => p._id.toString());

      // Find the quote request and ensure it's for seller's product and is a product quote
      const existingRequest = await UnifiedQuoteRequest.findOne({
        _id: id,
        requestType: "product_quote"  // Sellers only handle product quotes
      }).populate("product", "_id");

      if (!existingRequest) {
        return res.status(404).json({ 
          success: false, 
          message: "Quote request not found",
          error: {
            code: "NOT_FOUND",
            details: "The quote request does not exist or is not a product quote"
          }
        });
      }

      // Verify seller owns the product
      if (!productIds.includes(existingRequest.product._id.toString())) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
          error: {
            code: "UNAUTHORIZED",
            details: "You can only update status for quote requests on your own products"
          }
        });
      }

      // Prepare update data
      const updateData = { 
        status,
        updatedAt: new Date()
      };

      // Add admin note if provided
      if (adminNote) {
        updateData.adminNote = adminNote;
      }

      // Add status message to history if message provided
      if (message) {
        updateData.$push = {
          statusMessage: {
            status,
            message,
            date: new Date(),
            updatedBy: "seller"
          }
        };
      }

      const updatedRequest = await UnifiedQuoteRequest.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )
        .populate({
          path: "product",
          select: "productName chemicalName tradeName countryOfOrigin" // removed category populate
        })
        .populate({
          path: "buyerId",
          select: "firstName lastName email company"
        });

      if (!updatedRequest) {
        return res.status(404).json({ 
          success: false, 
          message: "Quote request not found after update" 
        });
      }

      // Format response using helper
      const formattedResponse = QuoteRequestHelper.formatUnifiedResponse(updatedRequest);
      // Notify the buyer about status update (only if buyer details are available)
      console.log("🔶 Notifying buyer about status update for quote request ID:", formattedResponse.buyerId);
      if (formattedResponse.buyerId && formattedResponse.buyerId._id) {
        try {
          await Notification.create({
            userId: formattedResponse.buyerId._id,
            type: 'quote-status',
            message: `Status updated to '${status}' for your quote request on product: ${formattedResponse.product?.productName?.en || formattedResponse.product?.productName}`,
            redirectUrl: `/user/quotes/${formattedResponse._id}`,
            relatedId: formattedResponse._id,
            meta: {
              productId: formattedResponse.product?._id,
              status,
              sellerId: sellerId
            }
          });
        } catch (notifyErr) {
          console.error('Failed to notify buyer:', notifyErr);
        }
      }

      // Get buyer info
      const buyer = formattedResponse.user || formattedResponse.buyerId;

      // Create seller-focused response
      const responseData = {
        id: formattedResponse._id,
        requestType: formattedResponse.requestType,
        status: formattedResponse.status,
        message: formattedResponse.message,
        adminNote: formattedResponse.adminNote,
        createdAt: formattedResponse.createdAt,
        updatedAt: formattedResponse.updatedAt,
        statusHistory: formattedResponse.statusMessage || [],
        
        buyer: buyer ? {
          id: buyer._id,
          name: `${buyer.firstName} ${buyer.lastName}`.trim(),
          email: buyer.email,
          company: buyer.company
        } : null,
        
        product: formattedResponse.product ? {
          id: formattedResponse.product._id,
          productName: formattedResponse.product.productName,
          chemicalName: formattedResponse.product.chemicalName,
          tradeName: formattedResponse.product.tradeName
          // removed category
        } : null,
        
        orderDetails: {
          quantity: formattedResponse.quantity,
          uom: formattedResponse.uom,
          destination: formattedResponse.destination,
          country: formattedResponse.country,
          deliveryDate: formattedResponse.delivery_date
        },
        
        unified: formattedResponse.unified
      };

      res.status(200).json({
        success: true,
        message: `Quote request status updated to '${status}' successfully.`,
        data: responseData,
        meta: {
          updatedBy: "seller",
          updatedAt: new Date(),
          previousStatus: existingRequest.status,
          newStatus: status,
          statusTransition: `${existingRequest.status} → ${status}`
        }
      });
    } catch (err) {
      console.error("Error updating Quote request status:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update quote request status due to an internal server error.",
        error: {
          code: "UPDATE_ERROR",
          details: err.message
        }
      });
    }
  }
);

// Bulk status update endpoint for sellers
updateQuoteStatus.patch(
  "/bulk",
  authenticateUser,
  authorizeRoles("seller"),
  async (req, res) => {
    try {
      const { requestIds, status, message } = req.body;
      const sellerId = req.user.id;

      // Validate input
      if (!Array.isArray(requestIds) || requestIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request IDs array is required and must not be empty",
          error: {
            code: "INVALID_INPUT",
            details: "Provide an array of quote request IDs to update"
          }
        });
      }

      // Validate all IDs are valid ObjectIds
      const invalidIds = requestIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid quote request ID format",
          error: {
            code: "INVALID_IDS",
            details: `Invalid IDs: ${invalidIds.join(", ")}`
          }
        });
      }

      // Validate status
      const allowedStatuses = [
        "pending", "responded", "negotiation", "accepted", 
        "in_progress", "shipped", "delivered", "completed", 
        "rejected", "cancelled"
      ];
      
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status value provided.",
          error: {
            code: "INVALID_STATUS",
            details: `Status must be one of: ${allowedStatuses.join(", ")}`,
            allowedStatuses
          }
        });
      }

      // Find all products owned by this seller
      const sellerProducts = await Product.find({ createdBy: sellerId }).select("_id");
      const productIds = sellerProducts.map(p => p._id.toString());

      // Find quote requests that belong to seller's products
      const existingRequests = await UnifiedQuoteRequest.find({
        _id: { $in: requestIds },
        requestType: "product_quote"
      }).populate("product", "_id");

      // Filter requests that seller owns
      const validRequests = existingRequests.filter(request => 
        productIds.includes(request.product._id.toString())
      );

      if (validRequests.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No valid quote requests found for your products",
          error: {
            code: "NO_VALID_REQUESTS",
            details: "None of the provided request IDs belong to your products"
          }
        });
      }

      // Prepare bulk update
      const updateData = {
        status,
        updatedAt: new Date()
      };

      // Add status message to history if provided
      if (message) {
        updateData.$push = {
          statusMessage: {
            status,
            message,
            date: new Date(),
            updatedBy: "seller"
          }
        };
      }

      // Perform bulk update
      const updateResult = await UnifiedQuoteRequest.updateMany(
        { 
          _id: { $in: validRequests.map(r => r._id) }
        },
        updateData
      );

      // Get updated requests for response
      const updatedRequests = await UnifiedQuoteRequest.find({
        _id: { $in: validRequests.map(r => r._id) }
      })
        .populate("product", "productName")
        .populate("user", "firstName lastName")
        .populate("buyerId", "firstName lastName");

      const formattedRequests = updatedRequests.map(request => {
        const formatted = QuoteRequestHelper.formatUnifiedResponse(request);
        const buyer = formatted.user || formatted.buyerId;
        
        return {
          id: formatted._id,
          status: formatted.status,
          buyer: buyer ? `${buyer.firstName} ${buyer.lastName}`.trim() : null,
          product: formatted.product?.productName,
          updatedAt: formatted.updatedAt
        };
      });

      res.status(200).json({
        success: true,
        message: `Bulk status update completed. ${updateResult.modifiedCount} quote requests updated to '${status}'.`,
        data: {
          updatedRequests: formattedRequests,
          summary: {
            totalRequested: requestIds.length,
            validRequests: validRequests.length,
            updated: updateResult.modifiedCount,
            newStatus: status
          }
        },
        meta: {
          bulkOperation: true,
          updatedBy: "seller",
          updatedAt: new Date(),
          statusTransition: `bulk update → ${status}`
        }
      });

    } catch (err) {
      console.error("Error in bulk status update:", err);
      res.status(500).json({
        success: false,
        message: "Failed to perform bulk status update",
        error: {
          code: "BULK_UPDATE_ERROR",
          details: err.message
        }
      });
    }
  }
);

export default updateQuoteStatus;
