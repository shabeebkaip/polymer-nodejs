import express from "express";
import SupplierOfferRequest from "../../../models/supplierOfferRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const getSupplierSubmittedOffersHistory = express.Router();

// Get all offers submitted by the authenticated supplier
getSupplierSubmittedOffersHistory.get("", authenticateUser, async (req, res) => {
  try {
    const supplierId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "";
    
    const skip = (page - 1) * limit;

    // Build query
    let query = { supplierId };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const totalOffers = await SupplierOfferRequest.countDocuments(query);

    const offers = await SupplierOfferRequest.find(query)
      .populate({
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date status createdAt",
        populate: {
          path: "product",
          select: "productName chemicalName tradeName",
        }
      })
      .populate({
        path: "bulkOrderId",
        populate: {
          path: "user",
          select: "firstName lastName email company",
        }
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Format the response
    const formattedOffers = offers.map(offer => {
      const offerObj = offer.toObject();
      return {
        ...offerObj,
        buyer: offerObj.bulkOrderId?.user ? {
          name: `${offerObj.bulkOrderId.user.firstName} ${offerObj.bulkOrderId.user.lastName}`,
          email: offerObj.bulkOrderId.user.email,
          company: offerObj.bulkOrderId.user.company
        } : null,
        orderDetails: offerObj.bulkOrderId ? {
          id: offerObj.bulkOrderId._id,
          product: offerObj.bulkOrderId.product,
          quantity: offerObj.bulkOrderId.quantity,
          uom: offerObj.bulkOrderId.uom,
          city: offerObj.bulkOrderId.city,
          country: offerObj.bulkOrderId.country,
          deliveryDate: offerObj.bulkOrderId.delivery_date,
          orderStatus: offerObj.bulkOrderId.status,
          orderCreatedAt: offerObj.bulkOrderId.createdAt
        } : null
      };
    });

    res.status(200).json({
      success: true,
      message: "Supplier offer history retrieved successfully",
      data: formattedOffers,
      meta: {
        pagination: {
          total: totalOffers,
          page,
          totalPages: Math.ceil(totalOffers / limit),
          count: formattedOffers.length,
          limit
        },
        filters: {
          status
        },
        summary: {
          totalSubmitted: totalOffers,
          pending: await SupplierOfferRequest.countDocuments({ supplierId, status: "pending" }),
          approved: await SupplierOfferRequest.countDocuments({ supplierId, status: "approved" }),
          rejected: await SupplierOfferRequest.countDocuments({ supplierId, status: "rejected" })
        }
      }
    });

  } catch (error) {
    console.error("Error fetching supplier offer history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch supplier offer history",
      error: {
        code: "FETCH_ERROR",
        details: error.message
      }
    });
  }
})

// Get specific offer details by bulkOrderId for the authenticated supplier
getSupplierSubmittedOffersHistory.get("/:bulkOrderId", authenticateUser, async (req, res) => {
  try {
    const { bulkOrderId } = req.params;
    const supplierId = req.user.id;

    // Validate ObjectId
    if (!bulkOrderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bulk order ID format"
      });
    }

    const offer = await SupplierOfferRequest.findOne({ 
      bulkOrderId, 
      supplierId 
    })
      .populate({
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date status createdAt notes",
        populate: [
          {
            path: "product",
            select: "productName chemicalName tradeName description productImages countryOfOrigin color",
          },
          {
            path: "user",
            select: "firstName lastName email company phone address city state country",
          }
        ]
      });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found for this bulk order"
      });
    }

    // Format the response
    const offerObj = offer.toObject();
    const formattedOffer = {
      ...offerObj,
      buyer: offerObj.bulkOrderId?.user ? {
        name: `${offerObj.bulkOrderId.user.firstName} ${offerObj.bulkOrderId.user.lastName}`,
        email: offerObj.bulkOrderId.user.email,
        company: offerObj.bulkOrderId.user.company,
        phone: offerObj.bulkOrderId.user.phone,
        address: {
          city: offerObj.bulkOrderId.user.city,
          state: offerObj.bulkOrderId.user.state,
          country: offerObj.bulkOrderId.user.country,
          full: offerObj.bulkOrderId.user.address
        }
      } : null,
      orderDetails: offerObj.bulkOrderId ? {
        id: offerObj.bulkOrderId._id,
        product: offerObj.bulkOrderId.product,
        quantity: offerObj.bulkOrderId.quantity,
        uom: offerObj.bulkOrderId.uom,
        deliveryLocation: {
          city: offerObj.bulkOrderId.city,
          country: offerObj.bulkOrderId.country
        },
        deliveryDate: offerObj.bulkOrderId.delivery_date,
        orderStatus: offerObj.bulkOrderId.status,
        orderCreatedAt: offerObj.bulkOrderId.createdAt,
        notes: offerObj.bulkOrderId.notes
      } : null,
      statusTimeline: offerObj.statusMessage || []
    };

    res.status(200).json({
      success: true,
      message: "Supplier offer details retrieved successfully",
      data: formattedOffer
    });

  } catch (error) {
    console.error("Error fetching supplier offer details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch supplier offer details",
      error: {
        code: "FETCH_ERROR",
        details: error.message
      }
    });
  }
})

export default getSupplierSubmittedOffersHistory;
