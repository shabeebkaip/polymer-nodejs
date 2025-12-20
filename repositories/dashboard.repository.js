import User from "../models/user.js";
import Product from "../models/product.js";
import QuoteRequest from "../models/quoteRequest.js";
import SampleRequest from "../models/sampleRequest.js";
import BestDeal from "../models/bestDeal.js";
import DealQuoteRequest from "../models/dealQuoteRequest.js";
import mongoose from "mongoose";

/**
 * Dashboard Repository - Data access layer for dashboard analytics
 */
class DashboardRepository {
  // ========================
  // USER ANALYTICS
  // ========================

  async countUsersByType(userType) {
    return await User.countDocuments({ user_type: userType });
  }

  async countVerifiedUsers(userType) {
    return await User.countDocuments({ user_type: userType, verification: "approved" });
  }

  async countPendingVerifications() {
    return await User.countDocuments({ verification: "pending" });
  }

  async getMonthlyUserRegistrations(startOfYear, endOfYear) {
    return await User.aggregate([
      { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, user_type: "$user_type" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);
  }

  async getRecentUsers(limit = 5) {
    return await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("firstName lastName company user_type verification createdAt")
      .lean();
  }

  // ========================
  // PRODUCT ANALYTICS
  // ========================

  async countAllProducts() {
    return await Product.countDocuments();
  }

  async countProductsByDateRange(startDate, endDate) {
    return await Product.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });
  }

  async countProductsBySeller(sellerId) {
    return await Product.countDocuments({
      createdBy: new mongoose.Types.ObjectId(sellerId),
    });
  }

  async countSellerProductsByDateRange(sellerId, startDate, endDate) {
    return await Product.countDocuments({
      createdBy: new mongoose.Types.ObjectId(sellerId),
      createdAt: { $gte: startDate, $lte: endDate },
    });
  }

  // ========================
  // QUOTE REQUEST ANALYTICS
  // ========================

  async countAllQuoteRequests() {
    return await QuoteRequest.countDocuments();
  }

  async countQuoteRequestsByDateRange(startDate, endDate) {
    return await QuoteRequest.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });
  }

  async getMonthlyQuoteRequests(startOfYear, endOfYear) {
    return await QuoteRequest.aggregate([
      { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  async getQuoteRequestsByStatus() {
    return await QuoteRequest.aggregate([
      { $unwind: "$status" },
      { $sort: { "status.date": -1 } },
      { $group: { _id: "$_id", latestStatus: { $first: "$status.status" } } },
      { $group: { _id: "$latestStatus", count: { $sum: 1 } } },
    ]);
  }

  async getRecentQuoteRequests(limit = 5) {
    return await QuoteRequest.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("buyerId", "firstName lastName company")
      .populate("sellerId", "firstName lastName company")
      .populate("productId", "productName")
      .lean();
  }

  // Buyer-specific quote request methods
  async countQuoteRequestsByBuyer(buyerId) {
    return await QuoteRequest.countDocuments({
      buyerId: new mongoose.Types.ObjectId(buyerId),
    });
  }

  async countBuyerQuoteRequestsByStatus(buyerId, status) {
    const result = await QuoteRequest.aggregate([
      { $match: { buyerId: new mongoose.Types.ObjectId(buyerId) } },
      { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
      { $match: { "currentStatus.status": status } },
      { $count: "count" },
    ]);
    return result[0]?.count || 0;
  }

  async getMonthlyQuoteRequestsByBuyer(buyerId, startOfYear, endOfYear) {
    return await QuoteRequest.aggregate([
      {
        $match: {
          buyerId: new mongoose.Types.ObjectId(buyerId),
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  async getRecentQuoteRequestsByBuyer(buyerId, limit = 5) {
    return await QuoteRequest.find({ buyerId: new mongoose.Types.ObjectId(buyerId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sellerId", "firstName lastName company")
      .populate("productId", "productName price")
      .lean();
  }

  async getTopSellersByBuyer(buyerId, limit = 5) {
    return await QuoteRequest.aggregate([
      { $match: { buyerId: new mongoose.Types.ObjectId(buyerId) } },
      { $group: { _id: "$sellerId", requestCount: { $sum: 1 } } },
      { $sort: { requestCount: -1 } },
      { $limit: limit },
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
    ]);
  }

  // Seller-specific quote request methods
  async countQuoteRequestsBySeller(sellerId) {
    return await QuoteRequest.countDocuments({
      sellerId: new mongoose.Types.ObjectId(sellerId),
    });
  }

  async countSellerQuoteRequestsByStatus(sellerId, status) {
    const result = await QuoteRequest.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
      { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
      { $match: { "currentStatus.status": status } },
      { $count: "count" },
    ]);
    return result[0]?.count || 0;
  }

  async getMonthlyQuoteRequestsBySeller(sellerId, startOfYear, endOfYear) {
    return await QuoteRequest.aggregate([
      {
        $match: {
          sellerId: new mongoose.Types.ObjectId(sellerId),
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  async getRecentQuoteRequestsBySeller(sellerId, limit = 5) {
    return await QuoteRequest.find({ sellerId: new mongoose.Types.ObjectId(sellerId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("buyerId", "firstName lastName company")
      .populate("productId", "productName price")
      .lean();
  }

  async getTopBuyersBySeller(sellerId, limit = 5) {
    return await QuoteRequest.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: "$buyerId", requestCount: { $sum: 1 } } },
      { $sort: { requestCount: -1 } },
      { $limit: limit },
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
    ]);
  }

  async getTopProductsBySeller(sellerId, limit = 5) {
    return await QuoteRequest.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: "$productId", requestCount: { $sum: 1 } } },
      { $sort: { requestCount: -1 } },
      { $limit: limit },
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
    ]);
  }

  // ========================
  // SAMPLE REQUEST ANALYTICS
  // ========================

  async countAllSampleRequests() {
    return await SampleRequest.countDocuments();
  }

  async countSampleRequestsByDateRange(startDate, endDate) {
    return await SampleRequest.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });
  }

  async getMonthlySampleRequests(startOfYear, endOfYear) {
    return await SampleRequest.aggregate([
      { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  async getSampleRequestsByStatus() {
    return await SampleRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
  }

  async getRecentSampleRequests(limit = 5) {
    return await SampleRequest.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user", "firstName lastName company")
      .populate("product", "productName")
      .lean();
  }

  // Buyer-specific sample request methods
  async countSampleRequestsByBuyer(buyerId) {
    return await SampleRequest.countDocuments({
      user: new mongoose.Types.ObjectId(buyerId),
    });
  }

  async countBuyerSampleRequestsByStatus(buyerId, status) {
    return await SampleRequest.countDocuments({
      user: new mongoose.Types.ObjectId(buyerId),
      status,
    });
  }

  async getMonthlySampleRequestsByBuyer(buyerId, startOfYear, endOfYear) {
    return await SampleRequest.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(buyerId),
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  async getRecentSampleRequestsByBuyer(buyerId, limit = 5) {
    return await SampleRequest.find({ user: new mongoose.Types.ObjectId(buyerId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("product", "productName createdBy")
      .lean();
  }

  // Seller-specific sample request methods
  async countSampleRequestsBySeller(sellerId) {
    const result = await SampleRequest.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      { $match: { "productInfo.createdBy": new mongoose.Types.ObjectId(sellerId) } },
      { $count: "count" },
    ]);
    return result[0]?.count || 0;
  }

  async countSellerSampleRequestsByStatus(sellerId, status) {
    const result = await SampleRequest.aggregate([
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
          "productInfo.createdBy": new mongoose.Types.ObjectId(sellerId),
          status,
        },
      },
      { $count: "count" },
    ]);
    return result[0]?.count || 0;
  }

  async getMonthlySampleRequestsBySeller(sellerId, startOfYear, endOfYear) {
    return await SampleRequest.aggregate([
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
          "productInfo.createdBy": new mongoose.Types.ObjectId(sellerId),
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  async getRecentSampleRequestsBySeller(sellerId, limit = 5) {
    return await SampleRequest.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      { $match: { "productInfo.createdBy": new mongoose.Types.ObjectId(sellerId) } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
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
    ]);
  }

  // ========================
  // BEST DEAL ANALYTICS
  // ========================

  async countAllBestDeals() {
    return await BestDeal.countDocuments();
  }

  async countBestDealsByStatus(status) {
    return await BestDeal.countDocuments({ status });
  }

  async countBestDealsBySeller(sellerId) {
    return await BestDeal.countDocuments({
      sellerId: new mongoose.Types.ObjectId(sellerId),
    });
  }

  async countSellerBestDealsByStatus(sellerId, status) {
    return await BestDeal.countDocuments({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      status,
    });
  }

  async getRecentBestDealsBySeller(sellerId, limit = 5) {
    return await BestDeal.find({ sellerId: new mongoose.Types.ObjectId(sellerId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("productId", "productName price")
      .lean();
  }

  // ========================
  // DEAL QUOTE REQUEST ANALYTICS
  // ========================

  async countAllDealQuoteRequests() {
    return await DealQuoteRequest.countDocuments();
  }

  async countDealQuoteRequestsByBuyer(buyerId) {
    return await DealQuoteRequest.countDocuments({
      buyerId: new mongoose.Types.ObjectId(buyerId),
    });
  }

  async countBuyerDealQuoteRequestsByStatus(buyerId, status) {
    const result = await DealQuoteRequest.aggregate([
      { $match: { buyerId: new mongoose.Types.ObjectId(buyerId) } },
      { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
      { $match: { "currentStatus.status": status } },
      { $count: "count" },
    ]);
    return result[0]?.count || 0;
  }

  async getRecentDealQuoteRequestsByBuyer(buyerId, limit = 5) {
    return await DealQuoteRequest.find({ buyerId: new mongoose.Types.ObjectId(buyerId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sellerId", "firstName lastName company")
      .populate({
        path: "bestDealId",
        populate: { path: "productId", select: "productName" },
      })
      .lean();
  }

  async countDealQuoteRequestsBySeller(sellerId) {
    return await DealQuoteRequest.countDocuments({
      sellerId: new mongoose.Types.ObjectId(sellerId),
    });
  }

  async countSellerDealQuoteRequestsByStatus(sellerId, status) {
    const result = await DealQuoteRequest.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
      { $addFields: { currentStatus: { $arrayElemAt: ["$status", -1] } } },
      { $match: { "currentStatus.status": status } },
      { $count: "count" },
    ]);
    return result[0]?.count || 0;
  }
}

export default new DashboardRepository();
