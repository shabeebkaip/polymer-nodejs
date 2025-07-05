import express from "express";
import BulkOrder from "../../../models/bulkOrder.js";
import SupplierOfferRequest from "../../../models/supplierOfferRequest.js";

const getApprovedBulkOrders = express.Router();

getApprovedBulkOrders.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get query filters for opportunities
    const { priority, location, productType, hasOffers } = req.query;

    // Build query
    let query = { status: "approved" };

    // Add filters if provided
    if (location) {
      query.$or = [
        { city: { $regex: location, $options: 'i' } },
        { country: { $regex: location, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const totalOrders = await BulkOrder.countDocuments(query);

    const approvedOrders = await BulkOrder.find(query)
      .populate({
        path: "product", 
        select: "productName chemicalName tradeName productImages countryOfOrigin color polymerType chemicalFamily",
        populate: [
          { path: "polymerType", select: "name" },
          { path: "chemicalFamily", select: "name" }
        ]
      })
      .populate({
        path: "user", 
        select: "firstName lastName company email phone city country userType"
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get offer counts for each order
    const orderIds = approvedOrders.map(order => order._id);
    const offerCounts = await SupplierOfferRequest.aggregate([
      { $match: { bulkOrderId: { $in: orderIds } } },
      { 
        $group: { 
          _id: "$bulkOrderId", 
          totalOffers: { $sum: 1 },
          pendingOffers: { 
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } 
          },
          approvedOffers: { 
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } 
          },
          rejectedOffers: { 
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } 
          }
        } 
      }
    ]);

    // Create a map for quick lookup
    const offerCountMap = offerCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item;
      return acc;
    }, {});

    let opportunities = approvedOrders.map((order) => {
      const obj = order.toObject();
      const orderId = obj._id.toString();
      const offerData = offerCountMap[orderId] || { 
        totalOffers: 0, 
        pendingOffers: 0, 
        approvedOffers: 0, 
        rejectedOffers: 0 
      };

      // Determine priority based on delivery date
      const isHighPriority = obj.delivery_date && 
        new Date(obj.delivery_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return {
        id: obj._id,
        productName: obj.product?.productName || 'N/A',
        chemicalName: obj.product?.chemicalName || '',
        tradeName: obj.product?.tradeName || '',
        description: `${obj.notes || 'Urgent requirement. Prefer earliest shipment.'}`,
        priority: isHighPriority ? 'HIGH' : 'NORMAL',
        buyer: {
          id: obj.user?._id,
          name: obj.user ? `${obj.user.firstName} ${obj.user.lastName}` : 'Unknown',
          company: obj.user?.company || '',
          location: `${obj.user?.city || ''}, ${obj.user?.country || ''}`.replace(/^, |, $/, ''),
          isVerified: obj.user?.userType === 'verified' || obj.user?.userType === 'admin',
          email: obj.user?.email,
          phone: obj.user?.phone
        },
        quantity: obj.quantity,
        uom: obj.uom,
        deadline: obj.delivery_date,
        destination: `${obj.city}, ${obj.country}`,
        responses: {
          count: offerData.totalOffers,
          hasResponses: offerData.totalOffers > 0
        },
        offersSummary: {
          totalResponses: offerData.totalOffers,
          pendingOffers: offerData.pendingOffers,
          approvedOffers: offerData.approvedOffers,
          rejectedOffers: offerData.rejectedOffers,
          hasResponses: offerData.totalOffers > 0
        },
        timeline: {
          posted: obj.createdAt,
          deadline: obj.delivery_date,
          daysLeft: obj.delivery_date ? 
            Math.max(0, Math.ceil((new Date(obj.delivery_date) - new Date()) / (1000 * 60 * 60 * 24))) : 
            null
        },
        product: {
          images: obj.product?.productImages || [],
          specifications: {
            countryOfOrigin: obj.product?.countryOfOrigin,
            color: obj.product?.color,
            polymerType: obj.product?.polymerType?.name,
            chemicalFamily: obj.product?.chemicalFamily?.name
          }
        },
        // Keep original structure for backward compatibility
        ...obj
      };
    });

    // Apply filters
    if (priority && priority !== 'ALL') {
      opportunities = opportunities.filter(opp => opp.priority === priority);
    }

    if (hasOffers === 'true') {
      opportunities = opportunities.filter(opp => opp.responses.hasResponses);
    } else if (hasOffers === 'false') {
      opportunities = opportunities.filter(opp => !opp.responses.hasResponses);
    }

    if (productType) {
      opportunities = opportunities.filter(opp => 
        opp.product.specifications.polymerType?.toLowerCase().includes(productType.toLowerCase()) ||
        opp.product.specifications.chemicalFamily?.toLowerCase().includes(productType.toLowerCase()) ||
        opp.productName?.toLowerCase().includes(productType.toLowerCase()) ||
        opp.chemicalName?.toLowerCase().includes(productType.toLowerCase())
      );
    }

    res.status(200).json({ 
      success: true, 
      message: "Buyer opportunities retrieved successfully",
      data: opportunities,
      meta: {
        pagination: {
          total: totalOrders,
          page,
          totalPages: Math.ceil(totalOrders / limit),
          count: opportunities.length,
          limit
        },
        filters: {
          priority: priority || 'ALL',
          location: location || '',
          productType: productType || '',
          hasOffers: hasOffers || 'ALL'
        },
        summary: {
          totalOpportunities: opportunities.length,
          highPriorityCount: opportunities.filter(opp => opp.priority === 'HIGH').length,
          withResponsesCount: opportunities.filter(opp => opp.responses.hasResponses).length,
          withoutResponsesCount: opportunities.filter(opp => !opp.responses.hasResponses).length,
          ordersWithOffers: opportunities.filter(order => order.offersSummary.hasResponses).length,
          ordersWithoutOffers: opportunities.filter(order => !order.offersSummary.hasResponses).length
        }
      }
    });
  } catch (err) {
    console.error("Buyer opportunities fetch error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch buyer opportunities",
      error: {
        code: "FETCH_ERROR",
        details: err.message
      }
    });
  }
});

getApprovedBulkOrders.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid bulk order ID format",
        error: {
          code: "INVALID_ID",
          details: "Please provide a valid bulk order ID"
        }
      });
    }

    // Fetch the approved bulk order by ID
    const bulkOrder = await BulkOrder.findOne({ _id: id, status: "approved" })
      .populate({
        path: "user",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "product",
        select: "productName chemicalName description tradeName productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName email phone company address city state country",
        }
      });

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: "Approved bulk order not found",
        error: {
          code: "NOT_FOUND",
          details: "The requested approved bulk order does not exist"
        }
      });
    }

    // Get all supplier offers for this bulk order with detailed information
    const offers = await SupplierOfferRequest.find({ bulkOrderId: id })
      .populate({
        path: "supplierId", 
        select: "firstName lastName email company phone city country userType"
      })
      .populate({
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date"
      })
      .sort({ createdAt: -1 });

    // Format offers with supplier details
    const formattedOffers = offers.map(offer => {
      const offerObj = offer.toObject();
      return {
        ...offerObj,
        supplier: offerObj.supplierId ? {
          id: offerObj.supplierId._id,
          name: `${offerObj.supplierId.firstName} ${offerObj.supplierId.lastName}`,
          email: offerObj.supplierId.email,
          company: offerObj.supplierId.company,
          phone: offerObj.supplierId.phone,
          location: `${offerObj.supplierId.city}, ${offerObj.supplierId.country}`,
          userType: offerObj.supplierId.userType
        } : null
      };
    });

    // Get offer statistics
    const offerStats = {
      totalOffers: offers.length,
      pendingOffers: offers.filter(offer => offer.status === "pending").length,
      approvedOffers: offers.filter(offer => offer.status === "approved").length,
      rejectedOffers: offers.filter(offer => offer.status === "rejected").length,
      hasOffers: offers.length > 0
    };

    // Format the response to include comprehensive order and offer information
    const orderObj = bulkOrder.toObject();
    const formattedOrder = {
      ...orderObj,
      buyer: orderObj.user ? {
        id: orderObj.user._id,
        name: `${orderObj.user.firstName} ${orderObj.user.lastName}`,
        email: orderObj.user.email,
        phone: orderObj.user.phone,
        company: orderObj.user.company,
        address: {
          full: orderObj.user.address,
          city: orderObj.user.city,
          state: orderObj.user.state,
          country: orderObj.user.country,
          pincode: orderObj.user.pincode
        },
        userType: orderObj.user.userType
      } : null,
      destination: `${orderObj.city}, ${orderObj.country}`,
      priority: orderObj.delivery_date && new Date(orderObj.delivery_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'HIGH' : 'NORMAL',
      statusTracking: {
        adminStatus: orderObj.status, // pending, approved, rejected
        sellerStatus: orderObj.sellerStatus, // seller's status updates
        lastUpdate: orderObj.statusMessage && orderObj.statusMessage.length > 0
          ? orderObj.statusMessage[orderObj.statusMessage.length - 1].date
          : orderObj.updatedAt,
        totalUpdates: orderObj.statusMessage ? orderObj.statusMessage.length : 0,
        statusHistory: orderObj.statusMessage || []
      }
    };

    res.status(200).json({
      success: true,
      message: "Approved bulk order details and supplier offers retrieved successfully",
      data: {
        order: formattedOrder,
        offers: formattedOffers,
        offerStatistics: offerStats
      }
    });

  } catch (error) {
    console.error("Error fetching approved bulk order detail:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch approved bulk order details",
      error: {
        code: "FETCH_ERROR",
        details: error.message
      }
    });
  }
});

export default getApprovedBulkOrders;