import DashboardRepository from "../repositories/dashboard.repository.js";
import {
  CACHE_KEYS,
  CACHE_TTL,
  cacheWrapper,
  invalidateAdminDashboardCache,
  invalidateBuyerDashboardCache,
  invalidateSellerDashboardCache,
} from "../utils/redis.js";

/**
 * Dashboard Service - Intelligent Analytics for Admin, Buyers, and Sellers
 * Uses Repository Pattern for data access
 * Implements Redis caching for improved performance
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

  async getAdminDashboard(forceRefresh = false) {
    // Use cache wrapper for automatic caching
    const { data, fromCache } = await cacheWrapper(
      CACHE_KEYS.ADMIN_DASHBOARD,
      () => this._fetchAdminDashboardData(),
      CACHE_TTL.ADMIN_DASHBOARD
    );

    return {
      ...data,
      _meta: {
        fromCache,
        cachedAt: fromCache ? new Date().toISOString() : null,
        ttl: CACHE_TTL.ADMIN_DASHBOARD,
      },
    };
  }

  /**
   * Fetch admin dashboard data from database
   * @private
   */
  async _fetchAdminDashboardData() {
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
      DashboardRepository.countUsersByType("buyer"),
      DashboardRepository.countUsersByType("seller"),
      DashboardRepository.countVerifiedUsers("buyer"),
      DashboardRepository.countVerifiedUsers("seller"),
      DashboardRepository.countPendingVerifications(),
      
      // Product counts
      DashboardRepository.countAllProducts(),
      DashboardRepository.countProductsByDateRange(startOfMonth, endOfMonth),
      
      // Quote Request analytics
      DashboardRepository.countAllQuoteRequests(),
      DashboardRepository.countQuoteRequestsByDateRange(startOfMonth, endOfMonth),
      DashboardRepository.getMonthlyQuoteRequests(startOfYear, endOfYear),
      DashboardRepository.getQuoteRequestsByStatus(),
      
      // Sample Request analytics
      DashboardRepository.countAllSampleRequests(),
      DashboardRepository.countSampleRequestsByDateRange(startOfMonth, endOfMonth),
      DashboardRepository.getMonthlySampleRequests(startOfYear, endOfYear),
      DashboardRepository.getSampleRequestsByStatus(),
      
      // Best Deals analytics
      DashboardRepository.countAllBestDeals(),
      DashboardRepository.countBestDealsByStatus("pending"),
      DashboardRepository.countBestDealsByStatus("approved"),
      
      // Deal Quote Requests
      DashboardRepository.countAllDealQuoteRequests(),
      
      // Monthly user registrations
      DashboardRepository.getMonthlyUserRegistrations(startOfYear, endOfYear),
      
      // Recent activities
      DashboardRepository.getRecentQuoteRequests(5),
      DashboardRepository.getRecentSampleRequests(5),
      DashboardRepository.getRecentUsers(5),
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

  async getBuyerDashboard(buyerId, forceRefresh = false) {
    // Use cache wrapper for automatic caching
    const { data, fromCache } = await cacheWrapper(
      CACHE_KEYS.BUYER_DASHBOARD(buyerId),
      () => this._fetchBuyerDashboardData(buyerId),
      CACHE_TTL.BUYER_DASHBOARD
    );

    return {
      ...data,
      _meta: {
        fromCache,
        cachedAt: fromCache ? new Date().toISOString() : null,
        ttl: CACHE_TTL.BUYER_DASHBOARD,
      },
    };
  }

  /**
   * Fetch buyer dashboard data from database
   * @private
   */
  async _fetchBuyerDashboardData(buyerId) {
    const { startOfYear, endOfYear } = this.getYearDateRange();

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
      DashboardRepository.countQuoteRequestsByBuyer(buyerId),
      DashboardRepository.countBuyerQuoteRequestsByStatus(buyerId, "pending"),
      DashboardRepository.countBuyerQuoteRequestsByStatus(buyerId, "responded"),
      DashboardRepository.countBuyerQuoteRequestsByStatus(buyerId, "accepted"),
      DashboardRepository.getMonthlyQuoteRequestsByBuyer(buyerId, startOfYear, endOfYear),
      
      // Sample Request counts
      DashboardRepository.countSampleRequestsByBuyer(buyerId),
      DashboardRepository.countBuyerSampleRequestsByStatus(buyerId, "pending"),
      DashboardRepository.countBuyerSampleRequestsByStatus(buyerId, "sent"),
      DashboardRepository.countBuyerSampleRequestsByStatus(buyerId, "delivered"),
      DashboardRepository.getMonthlySampleRequestsByBuyer(buyerId, startOfYear, endOfYear),
      
      // Deal Quote Requests
      DashboardRepository.countDealQuoteRequestsByBuyer(buyerId),
      DashboardRepository.countBuyerDealQuoteRequestsByStatus(buyerId, "pending"),
      
      // Recent quote requests
      DashboardRepository.getRecentQuoteRequestsByBuyer(buyerId, 5),
      
      // Recent sample requests
      DashboardRepository.getRecentSampleRequestsByBuyer(buyerId, 5),
      
      // Recent deal quote requests
      DashboardRepository.getRecentDealQuoteRequestsByBuyer(buyerId, 5),
      
      // Top sellers
      DashboardRepository.getTopSellersByBuyer(buyerId, 5),
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

  async getSellerDashboard(sellerId, forceRefresh = false) {
    // Use cache wrapper for automatic caching
    const { data, fromCache } = await cacheWrapper(
      CACHE_KEYS.SELLER_DASHBOARD(sellerId),
      () => this._fetchSellerDashboardData(sellerId),
      CACHE_TTL.SELLER_DASHBOARD
    );

    return {
      ...data,
      _meta: {
        fromCache,
        cachedAt: fromCache ? new Date().toISOString() : null,
        ttl: CACHE_TTL.SELLER_DASHBOARD,
      },
    };
  }

  /**
   * Fetch seller dashboard data from database
   * @private
   */
  async _fetchSellerDashboardData(sellerId) {
    const { startOfYear, endOfYear } = this.getYearDateRange();
    const { startOfMonth, endOfMonth } = this.getMonthDateRange();

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
      DashboardRepository.countProductsBySeller(sellerId),
      DashboardRepository.countSellerProductsByDateRange(sellerId, startOfMonth, endOfMonth),
      
      // Quote Request counts
      DashboardRepository.countQuoteRequestsBySeller(sellerId),
      DashboardRepository.countSellerQuoteRequestsByStatus(sellerId, "pending"),
      DashboardRepository.countSellerQuoteRequestsByStatus(sellerId, "responded"),
      DashboardRepository.countSellerQuoteRequestsByStatus(sellerId, "accepted"),
      DashboardRepository.getMonthlyQuoteRequestsBySeller(sellerId, startOfYear, endOfYear),
      
      // Sample Request counts (for seller's products)
      DashboardRepository.countSampleRequestsBySeller(sellerId),
      DashboardRepository.countSellerSampleRequestsByStatus(sellerId, "pending"),
      DashboardRepository.countSellerSampleRequestsByStatus(sellerId, "sent"),
      DashboardRepository.getMonthlySampleRequestsBySeller(sellerId, startOfYear, endOfYear),
      
      // Best Deals counts
      DashboardRepository.countBestDealsBySeller(sellerId),
      DashboardRepository.countSellerBestDealsByStatus(sellerId, "pending"),
      DashboardRepository.countSellerBestDealsByStatus(sellerId, "approved"),
      
      // Deal Quote Requests
      DashboardRepository.countDealQuoteRequestsBySeller(sellerId),
      DashboardRepository.countSellerDealQuoteRequestsByStatus(sellerId, "pending"),
      
      // Recent quote requests
      DashboardRepository.getRecentQuoteRequestsBySeller(sellerId, 5),
      
      // Recent sample requests for seller's products
      DashboardRepository.getRecentSampleRequestsBySeller(sellerId, 5),
      
      // Recent best deals
      DashboardRepository.getRecentBestDealsBySeller(sellerId, 5),
      
      // Top buyers
      DashboardRepository.getTopBuyersBySeller(sellerId, 5),
      
      // Top products by quote requests
      DashboardRepository.getTopProductsBySeller(sellerId, 5),
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

  // ========================
  // CACHE INVALIDATION METHODS
  // ========================

  /**
   * Invalidate admin dashboard cache
   * Call this when admin-related data changes
   */
  async invalidateAdminCache() {
    return await invalidateAdminDashboardCache();
  }

  /**
   * Invalidate buyer dashboard cache
   * Call this when buyer-related data changes
   * @param {string} buyerId - Buyer ID
   */
  async invalidateBuyerCache(buyerId) {
    // Also invalidate admin cache since admin sees all data
    await invalidateAdminDashboardCache();
    return await invalidateBuyerDashboardCache(buyerId);
  }

  /**
   * Invalidate seller dashboard cache
   * Call this when seller-related data changes
   * @param {string} sellerId - Seller ID
   */
  async invalidateSellerCache(sellerId) {
    // Also invalidate admin cache since admin sees all data
    await invalidateAdminDashboardCache();
    return await invalidateSellerDashboardCache(sellerId);
  }

  /**
   * Invalidate caches when a quote request is created/updated
   * @param {string} buyerId - Buyer ID
   * @param {string} sellerId - Seller ID
   */
  async invalidateQuoteRequestCache(buyerId, sellerId) {
    await Promise.all([
      invalidateAdminDashboardCache(),
      buyerId ? invalidateBuyerDashboardCache(buyerId) : Promise.resolve(),
      sellerId ? invalidateSellerDashboardCache(sellerId) : Promise.resolve(),
    ]);
  }

  /**
   * Invalidate caches when a sample request is created/updated
   * @param {string} buyerId - Buyer ID
   * @param {string} sellerId - Seller ID (product owner)
   */
  async invalidateSampleRequestCache(buyerId, sellerId) {
    await Promise.all([
      invalidateAdminDashboardCache(),
      buyerId ? invalidateBuyerDashboardCache(buyerId) : Promise.resolve(),
      sellerId ? invalidateSellerDashboardCache(sellerId) : Promise.resolve(),
    ]);
  }

  /**
   * Invalidate caches when a best deal is created/updated
   * @param {string} sellerId - Seller ID
   */
  async invalidateBestDealCache(sellerId) {
    await Promise.all([
      invalidateAdminDashboardCache(),
      sellerId ? invalidateSellerDashboardCache(sellerId) : Promise.resolve(),
    ]);
  }

  /**
   * Invalidate caches when a product is created/updated
   * @param {string} sellerId - Seller ID
   */
  async invalidateProductCache(sellerId) {
    await Promise.all([
      invalidateAdminDashboardCache(),
      sellerId ? invalidateSellerDashboardCache(sellerId) : Promise.resolve(),
    ]);
  }

  /**
   * Invalidate caches when a user is created/updated
   * @param {string} userId - User ID
   * @param {string} userType - User type (buyer/seller)
   */
  async invalidateUserCache(userId, userType) {
    await invalidateAdminDashboardCache();
    if (userType === "buyer") {
      await invalidateBuyerDashboardCache(userId);
    } else if (userType === "seller") {
      await invalidateSellerDashboardCache(userId);
    }
  }
}

export default new DashboardService();
