import User from "../models/user.js";
import Product from "../models/product.js";
import QuoteRequest from "../models/quoteRequest.js";
import SampleRequest from "../models/sampleRequest.js";
import BestDeal from "../models/bestDeal.js";
import DealQuoteRequest from "../models/dealQuoteRequest.js";
import mongoose from "mongoose";

/**
 * Dashboard Service - Intelligent Analytics for Admin, Buyers, and Sellers
 */
class DashboardService {
  /**
   * Get the current year date range
   */
  getYearDateRange() {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
    return { startOfYear, endOfYear };
  }

  /**
   * Get the current month date range
   */
  getMonthDateRange() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { startOfMonth, endOfMonth };
  }

  /**
   * Generate monthly data array with filled zeros
   */
  fillMonthlyData(monthlyData, key = "count") {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const data = monthlyData.find((m) => m._id === month);
      return { month, [key]: data ? data[key] : 0 };
    });
  }

  /**
   * Get current status from status array
   */
  getCurrentStatus(statusArray) {
    if (statusArray && statusArray.length > 0) {
      return statusArray[statusArray.length - 1].status;
    }
    return "pending";
  }

  // ========================
  // ADMIN DASHBOARD ANALYTICS
  // ========================

  async getAdminDashboard() {
    const { startOfYear, endOfYear } = this.getYearDateRange();
    const { startOfMonth, endOfMonth } = this.getMonthDateRange();

    const [
      // User counts
      totalBuyers,
      totalSellers,
      verifiedBuyers,
      verifiedSellers,
      pendingVerifications,
      
      // Product counts
      totalProducts,
      newProductsThisMonth,
      
      // Quote Request analytics
      totalQuoteRequests,
      quoteRequestsThisMonth,
      monthlyQuoteRequests,
      quoteRequestsByStatus,
      
      // Sample Request analytics
      totalSampleRequests,
      sampleRequestsThisMonth,
      monthlySampleRequests,
      sampleRequestsByStatus,
      
      // Best Deals analytics
      totalBestDeals,
      pendingBestDeals,
      approvedBestDeals,
      
      // Deal Quote Requests
      totalDealQuoteRequests,
      
      // Monthly user registrations
      monthlyUserRegistrations,
      
      // Recent activities
      recentQuoteRequests,
      recentSampleRequests,
      recentUsers,
    ] = await Promise.all([
      // User counts
      User.countDocuments({ user_type: "buyer" }),
      User.countDocuments({ user_type: "seller" }),
      User.countDocuments({ user_type: "buyer", verification: "approved" }),
      User.countDocuments({ user_type: "seller", verification: "approved" }),
      User.countDocuments({ verification: "pending" }),
      
      // Product counts
      Product.countDocuments(),
      Product.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      
      // Quote Request analytics
      QuoteRequest.countDocuments(),
      QuoteRequest.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      QuoteRequest.aggregate([
        { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      QuoteRequest.aggregate([
        { $unwind: "$status" },
        { $sort: { "status.date": -1 } },
        { $group: { _id: "$_id", latestStatus: { $first: "$status.status" } } },
        { $group: { _id: "$latestStatus", count: { $sum: 1 } } },
      ]),
      
      // Sample Request analytics
      SampleRequest.countDocuments(),
      SampleRequest.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      SampleRequest.aggregate([
        { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      SampleRequest.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      
      // Best Deals analytics
      BestDeal.countDocuments(),
      BestDeal.countDocuments({ status: "pending" }),
      BestDeal.countDocuments({ status: "approved" }),
      
      // Deal Quote Requests
      DealQuoteRequest.countDocuments(),
      
      // Monthly user registrations
      User.aggregate([
        { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" }, user_type: "$user_type" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]),
      
      // Recent activities
      QuoteRequest.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("buyerId", "firstName lastName company")
        .populate("sellerId", "firstName lastName company")
        .populate("productId", "productName")
        .lean(),
      SampleRequest.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "firstName lastName company")
        .populate("product", "productName")
        .lean(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("firstName lastName company user_type verification createdAt")
        .lean(),
    ]);

    // Process monthly user registrations
    const processedUserRegistrations = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const buyerData = monthlyUserRegistrations.find(
        (m) => m._id.month === month && m._id.user_type === "buyer"
      );
      const sellerData = monthlyUserRegistrations.find(
        (m) => m._id.month === month && m._id.user_type === "seller"
      );
      return {
        month,
        buyers: buyerData ? buyerData.count : 0,
        sellers: sellerData ? sellerData.count : 0,
      };
    });

    return {
      cards: {
        users: {
          totalBuyers,
          totalSellers,
          verifiedBuyers,
          verifiedSellers,
          pendingVerifications,
        },
        products: {
          total: totalProducts,
          newThisMonth: newProductsThisMonth,
        },
        quoteRequests: {
          total: totalQuoteRequests,
          thisMonth: quoteRequestsThisMonth,
        },
        sampleRequests: {
          total: totalSampleRequests,
          thisMonth: sampleRequestsThisMonth,
        },
        bestDeals: {
          total: totalBestDeals,
          pending: pendingBestDeals,
          approved: approvedBestDeals,
        },
        dealQuoteRequests: {
          total: totalDealQuoteRequests,
        },
      },
      charts: {
        monthlyQuoteRequests: this.fillMonthlyData(monthlyQuoteRequests),
        monthlySampleRequests: this.fillMonthlyData(monthlySampleRequests),
        monthlyUserRegistrations: processedUserRegistrations,
        quoteRequestsByStatus: quoteRequestsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        sampleRequestsByStatus: sampleRequestsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      recentActivity: {
        quoteRequests: recentQuoteRequests.map((qr) => ({
          _id: qr._id,
          buyer: qr.buyerId ? `${qr.buyerId.firstName} ${qr.buyerId.lastName}` : "N/A",
          seller: qr.sellerId ? `${qr.sellerId.firstName} ${qr.sellerId.lastName}` : "N/A",
          product: qr.productId?.productName || "N/A",
          status: this.getCurrentStatus(qr.status),
          createdAt: qr.createdAt,
        })),
        sampleRequests: recentSampleRequests.map((sr) => ({
          _id: sr._id,
          user: sr.user ? `${sr.user.firstName} ${sr.user.lastName}` : "N/A",
          product: sr.product?.productName || "N/A",
          status: sr.status,
          createdAt: sr.createdAt,
        })),
        users: recentUsers,
      },
    };
  }

  // ========================
  // BUYER DASHBOARD ANALYTICS
  // ========================

  async getBuyerDashboard(buyerId) {
    const { startOfYear, endOfYear } = this.getYearDateRange();
    const { startOfMonth, endOfMonth } = this.getMonthDateRange();
    const buyerObjectId = new mongoose.Types.ObjectId(buyerId);

    const [
      // Quote Request analytics for buyer
      totalQuoteRequests,
      pendingQuoteRequests,
      respondedQuoteRequests,
      acceptedQuoteRequests,
      monthlyQuoteRequests,
      
      // Sample Request analytics for buyer
      totalSampleRequests,
      pendingSampleRequests,
      sentSampleRequests,
      deliveredSampleRequests,
      monthlySampleRequests,
      
      // Deal Quote Requests for buyer
      totalDealQuoteRequests,
      pendingDealQuoteRequests,
      
      // Recent quote requests
      recentQuoteRequests,
      
      // Recent sample requests
      recentSampleRequests,
      
      // Recent deal quote requests
      recentDealQuoteRequests,
      
      // Top sellers interacted with
      topSellers,
    ] = await Promise.all([
      // Quote Request counts
      QuoteRequest.countDocuments({ buyerId: buyerObjectId }),
      QuoteRequest.countDocuments({
        buyerId: buyerObjectId,
        "status.status": "pending",
      }).then(async () => {
        const result = await QuoteRequest.aggregate([
          { $match: { buyerId: buyerObjectId } },
          { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
          { $match: { "currentStatus.status": "pending" } },
          { $count: "count" },
        ]);
        return result[0]?.count || 0;
      }),
      QuoteRequest.aggregate([
        { $match: { buyerId: buyerObjectId } },
        { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
        { $match: { "currentStatus.status": "responded" } },
        { $count: "count" },
      ]).then((r) => r[0]?.count || 0),
      QuoteRequest.aggregate([
        { $match: { buyerId: buyerObjectId } },
        { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
        { $match: { "currentStatus.status": "accepted" } },
        { $count: "count" },
      ]).then((r) => r[0]?.count || 0),
      QuoteRequest.aggregate([
        { $match: { buyerId: buyerObjectId, createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      
      // Sample Request counts
      SampleRequest.countDocuments({ user: buyerObjectId }),
      SampleRequest.countDocuments({ user: buyerObjectId, status: "pending" }),
      SampleRequest.countDocuments({ user: buyerObjectId, status: "sent" }),
      SampleRequest.countDocuments({ user: buyerObjectId, status: "delivered" }),
      SampleRequest.aggregate([
        { $match: { user: buyerObjectId, createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      
      // Deal Quote Requests
      DealQuoteRequest.countDocuments({ buyerId: buyerObjectId }),
      DealQuoteRequest.aggregate([
        { $match: { buyerId: buyerObjectId } },
        { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
        { $match: { "currentStatus.status": "pending" } },
        { $count: "count" },
      ]).then((r) => r[0]?.count || 0),
      
      // Recent quote requests
      QuoteRequest.find({ buyerId: buyerObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("sellerId", "firstName lastName company")
        .populate("productId", "productName price")
        .lean(),
      
      // Recent sample requests
      SampleRequest.find({ user: buyerObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("product", "productName createdBy")
        .lean(),
      
      // Recent deal quote requests
      DealQuoteRequest.find({ buyerId: buyerObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("sellerId", "firstName lastName company")
        .populate({
          path: "bestDealId",
          populate: { path: "productId", select: "productName" },
        })
        .lean(),
      
      // Top sellers
      QuoteRequest.aggregate([
        { $match: { buyerId: buyerObjectId } },
        { $group: { _id: "$sellerId", requestCount: { $sum: 1 } } },
        { $sort: { requestCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },
        { $unwind: "$seller" },
        {
          $project: {
            _id: "$seller._id",
            name: { $concat: ["$seller.firstName", " ", "$seller.lastName"] },
            company: "$seller.company",
            requestCount: 1,
          },
        },
      ]),
    ]);

    return {
      cards: {
        quoteRequests: {
          total: totalQuoteRequests,
          pending: pendingQuoteRequests,
          responded: respondedQuoteRequests,
          accepted: acceptedQuoteRequests,
        },
        sampleRequests: {
          total: totalSampleRequests,
          pending: pendingSampleRequests,
          sent: sentSampleRequests,
          delivered: deliveredSampleRequests,
        },
        dealQuoteRequests: {
          total: totalDealQuoteRequests,
          pending: pendingDealQuoteRequests,
        },
      },
      charts: {
        monthlyQuoteRequests: this.fillMonthlyData(monthlyQuoteRequests),
        monthlySampleRequests: this.fillMonthlyData(monthlySampleRequests),
      },
      recentActivity: {
        quoteRequests: recentQuoteRequests.map((qr) => ({
          _id: qr._id,
          seller: qr.sellerId ? `${qr.sellerId.firstName} ${qr.sellerId.lastName}` : "N/A",
          sellerCompany: qr.sellerId?.company || "N/A",
          product: qr.productId?.productName || "N/A",
          desiredQuantity: qr.desiredQuantity,
          status: this.getCurrentStatus(qr.status),
          sellerResponse: qr.sellerResponse,
          createdAt: qr.createdAt,
        })),
        sampleRequests: recentSampleRequests.map((sr) => ({
          _id: sr._id,
          product: sr.product?.productName || "N/A",
          quantity: sr.quantity,
          status: sr.status,
          createdAt: sr.createdAt,
        })),
        dealQuoteRequests: recentDealQuoteRequests.map((dqr) => ({
          _id: dqr._id,
          seller: dqr.sellerId ? `${dqr.sellerId.firstName} ${dqr.sellerId.lastName}` : "N/A",
          product: dqr.bestDealId?.productId?.productName || "N/A",
          desiredQuantity: dqr.desiredQuantity,
          status: this.getCurrentStatus(dqr.status),
          createdAt: dqr.createdAt,
        })),
      },
      insights: {
        topSellers,
      },
    };
  }

  // ========================
  // SELLER DASHBOARD ANALYTICS
  // ========================

  async getSellerDashboard(sellerId) {
    const { startOfYear, endOfYear } = this.getYearDateRange();
    const { startOfMonth, endOfMonth } = this.getMonthDateRange();
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const [
      // Product analytics
      totalProducts,
      newProductsThisMonth,
      
      // Quote Request analytics for seller
      totalQuoteRequests,
      pendingQuoteRequests,
      respondedQuoteRequests,
      acceptedQuoteRequests,
      monthlyQuoteRequests,
      
      // Sample Request analytics for seller
      totalSampleRequests,
      pendingSampleRequests,
      sentSampleRequests,
      monthlySampleRequests,
      
      // Best Deals analytics
      totalBestDeals,
      pendingBestDeals,
      approvedBestDeals,
      
      // Deal Quote Requests for seller
      totalDealQuoteRequests,
      pendingDealQuoteRequests,
      
      // Recent quote requests received
      recentQuoteRequests,
      
      // Recent sample requests for seller's products
      recentSampleRequests,
      
      // Recent best deals
      recentBestDeals,
      
      // Top buyers
      topBuyers,
      
      // Top products by quote requests
      topProducts,
    ] = await Promise.all([
      // Product counts
      Product.countDocuments({ createdBy: sellerObjectId }),
      Product.countDocuments({
        createdBy: sellerObjectId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      
      // Quote Request counts
      QuoteRequest.countDocuments({ sellerId: sellerObjectId }),
      QuoteRequest.aggregate([
        { $match: { sellerId: sellerObjectId } },
        { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
        { $match: { "currentStatus.status": "pending" } },
        { $count: "count" },
      ]).then((r) => r[0]?.count || 0),
      QuoteRequest.aggregate([
        { $match: { sellerId: sellerObjectId } },
        { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
        { $match: { "currentStatus.status": "responded" } },
        { $count: "count" },
      ]).then((r) => r[0]?.count || 0),
      QuoteRequest.aggregate([
        { $match: { sellerId: sellerObjectId } },
        { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
        { $match: { "currentStatus.status": "accepted" } },
        { $count: "count" },
      ]).then((r) => r[0]?.count || 0),
      QuoteRequest.aggregate([
        { $match: { sellerId: sellerObjectId, createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      
      // Sample Request counts (for seller's products)
      SampleRequest.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        { $match: { "productInfo.createdBy": sellerObjectId } },
        { $count: "count" },
      ]).then((r) => r[0]?.count || 0),
      SampleRequest.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        { $match: { "productInfo.createdBy": sellerObjectId, status: "pending" } },
        { $count: "count" },
      ]).then((r) => r[0]?.count || 0),
      SampleRequest.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        { $match: { "productInfo.createdBy": sellerObjectId, status: "sent" } },
        { $count: "count" },
      ]).then((r) => r[0]?.count || 0),
      SampleRequest.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        {
          $match: {
            "productInfo.createdBy": sellerObjectId,
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      
      // Best Deals counts
      BestDeal.countDocuments({ sellerId: sellerObjectId }),
      BestDeal.countDocuments({ sellerId: sellerObjectId, status: "pending" }),
      BestDeal.countDocuments({ sellerId: sellerObjectId, status: "approved" }),
      
      // Deal Quote Requests
      DealQuoteRequest.countDocuments({ sellerId: sellerObjectId }),
      DealQuoteRequest.aggregate([
        { $match: { sellerId: sellerObjectId } },
        { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
        { $match: { "currentStatus.status": "pending" } },
        { $count: "count" },
      ]).then((r) => r[0]?.count || 0),
      
      // Recent quote requests
      QuoteRequest.find({ sellerId: sellerObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("buyerId", "firstName lastName company")
        .populate("productId", "productName price")
        .lean(),
      
      // Recent sample requests for seller's products
      SampleRequest.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        { $match: { "productInfo.createdBy": sellerObjectId } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            quantity: 1,
            status: 1,
            createdAt: 1,
            productName: "$productInfo.productName",
            buyerName: {
              $concat: [
                { $ifNull: ["$userInfo.firstName", ""] },
                " ",
                { $ifNull: ["$userInfo.lastName", ""] },
              ],
            },
            buyerCompany: "$userInfo.company",
          },
        },
      ]),
      
      // Recent best deals
      BestDeal.find({ sellerId: sellerObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("productId", "productName price")
        .lean(),
      
      // Top buyers
      QuoteRequest.aggregate([
        { $match: { sellerId: sellerObjectId } },
        { $group: { _id: "$buyerId", requestCount: { $sum: 1 } } },
        { $sort: { requestCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "buyer",
          },
        },
        { $unwind: "$buyer" },
        {
          $project: {
            _id: "$buyer._id",
            name: { $concat: ["$buyer.firstName", " ", "$buyer.lastName"] },
            company: "$buyer.company",
            requestCount: 1,
          },
        },
      ]),
      
      // Top products by quote requests
      QuoteRequest.aggregate([
        { $match: { sellerId: sellerObjectId } },
        { $group: { _id: "$productId", requestCount: { $sum: 1 } } },
        { $sort: { requestCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: "$product._id",
            productName: "$product.productName",
            price: "$product.price",
            requestCount: 1,
          },
        },
      ]),
    ]);

    return {
      cards: {
        products: {
          total: totalProducts,
          newThisMonth: newProductsThisMonth,
        },
        quoteRequests: {
          total: totalQuoteRequests,
          pending: pendingQuoteRequests,
          responded: respondedQuoteRequests,
          accepted: acceptedQuoteRequests,
        },
        sampleRequests: {
          total: totalSampleRequests,
          pending: pendingSampleRequests,
          sent: sentSampleRequests,
        },
        bestDeals: {
          total: totalBestDeals,
          pending: pendingBestDeals,
          approved: approvedBestDeals,
        },
        dealQuoteRequests: {
          total: totalDealQuoteRequests,
          pending: pendingDealQuoteRequests,
        },
      },
      charts: {
        monthlyQuoteRequests: this.fillMonthlyData(monthlyQuoteRequests),
        monthlySampleRequests: this.fillMonthlyData(monthlySampleRequests),
      },
      recentActivity: {
        quoteRequests: recentQuoteRequests.map((qr) => ({
          _id: qr._id,
          buyer: qr.buyerId ? `${qr.buyerId.firstName} ${qr.buyerId.lastName}` : "N/A",
          buyerCompany: qr.buyerId?.company || "N/A",
          product: qr.productId?.productName || "N/A",
          desiredQuantity: qr.desiredQuantity,
          status: this.getCurrentStatus(qr.status),
          createdAt: qr.createdAt,
        })),
        sampleRequests: recentSampleRequests,
        bestDeals: recentBestDeals.map((bd) => ({
          _id: bd._id,
          product: bd.productId?.productName || "N/A",
          originalPrice: bd.productId?.price || 0,
          offerPrice: bd.offerPrice,
          status: bd.status,
          validity: bd.validity,
          createdAt: bd.createdAt,
        })),
      },
      insights: {
        topBuyers,
        topProducts,
      },
    };
  }
}

export default new DashboardService();
