import { Redis } from "@upstash/redis";
import { config } from "../config/config.js";

/**
 * Redis Client Utility (Upstash HTTP-based)
 * Provides caching functionality for the application
 */

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
const initRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  try {
    // Use Upstash REST API (more reliable than TCP)
    if (config.redis?.restUrl && config.redis?.restToken) {
      console.log("🔄 Connecting to Upstash Redis via REST API...");
      redisClient = new Redis({
        url: config.redis.restUrl,
        token: config.redis.restToken,
      });
      isConnected = true;
      console.log("✅ Redis client initialized (Upstash REST)");
    } else {
      console.log("⚠️ Redis not configured - UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required");
      isConnected = false;
    }
  } catch (error) {
    console.error("❌ Redis initialization error:", error.message);
    isConnected = false;
  }

  return redisClient;
};

/**
 * Get Redis client instance
 */
const getClient = () => {
  if (!redisClient) {
    initRedis();
  }
  return redisClient;
};

/**
 * Check if Redis is connected
 */
const isRedisConnected = () => isConnected;

/**
 * Test Redis connection
 */
const testConnection = async () => {
  try {
    if (!redisClient) return false;
    await redisClient.ping();
    console.log("✅ Redis connection verified");
    return true;
  } catch (error) {
    console.error("❌ Redis ping failed:", error.message);
    isConnected = false;
    return false;
  }
};

/**
 * Cache Keys Configuration
 */
const CACHE_KEYS = {
  ADMIN_DASHBOARD: "dashboard:admin",
  BUYER_DASHBOARD: (buyerId) => `dashboard:buyer:${buyerId}`,
  SELLER_DASHBOARD: (sellerId) => `dashboard:seller:${sellerId}`,
};

/**
 * Cache TTL Configuration (in seconds)
 */
const CACHE_TTL = {
  ADMIN_DASHBOARD: 300, // 5 minutes
  BUYER_DASHBOARD: 180, // 3 minutes
  SELLER_DASHBOARD: 180, // 3 minutes
  DEFAULT: 300, // 5 minutes
};

/**
 * Set cache with expiration
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 */
const setCache = async (key, data, ttl = CACHE_TTL.DEFAULT) => {
  try {
    if (!isConnected || !redisClient) {
      return false;
    }
    // Upstash uses 'ex' option for TTL
    await redisClient.set(key, JSON.stringify(data), { ex: ttl });
    return true;
  } catch (error) {
    console.error(`Redis setCache error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Get cache
 * @param {string} key - Cache key
 */
const getCache = async (key) => {
  try {
    if (!isConnected || !redisClient) {
      return null;
    }
    const data = await redisClient.get(key);
    if (data) {
      // Upstash may return parsed object or string
      return typeof data === "string" ? JSON.parse(data) : data;
    }
    return null;
  } catch (error) {
    console.error(`Redis getCache error for key ${key}:`, error.message);
    return null;
  }
};

/**
 * Delete cache
 * @param {string} key - Cache key
 */
const deleteCache = async (key) => {
  try {
    if (!isConnected || !redisClient) {
      return false;
    }
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Redis deleteCache error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete cache by pattern
 * @param {string} pattern - Key pattern (e.g., "dashboard:*")
 */
const deleteCacheByPattern = async (pattern) => {
  try {
    if (!isConnected || !redisClient) {
      return false;
    }
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    console.error(`Redis deleteCacheByPattern error for pattern ${pattern}:`, error.message);
    return false;
  }
};

/**
 * Invalidate all dashboard caches
 */
const invalidateAllDashboardCache = async () => {
  return await deleteCacheByPattern("dashboard:*");
};

/**
 * Invalidate admin dashboard cache
 */
const invalidateAdminDashboardCache = async () => {
  return await deleteCache(CACHE_KEYS.ADMIN_DASHBOARD);
};

/**
 * Invalidate buyer dashboard cache
 * @param {string} buyerId - Buyer ID
 */
const invalidateBuyerDashboardCache = async (buyerId) => {
  return await deleteCache(CACHE_KEYS.BUYER_DASHBOARD(buyerId));
};

/**
 * Invalidate seller dashboard cache
 * @param {string} sellerId - Seller ID
 */
const invalidateSellerDashboardCache = async (sellerId) => {
  return await deleteCache(CACHE_KEYS.SELLER_DASHBOARD(sellerId));
};

/**
 * Cache wrapper with automatic fetch on miss
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if cache miss
 * @param {number} ttl - Time to live in seconds
 */
const cacheWrapper = async (key, fetchFn, ttl = CACHE_TTL.DEFAULT) => {
  // Try to get from cache
  const cachedData = await getCache(key);
  if (cachedData) {
    return { data: cachedData, fromCache: true };
  }

  // Fetch fresh data
  const freshData = await fetchFn();

  // Store in cache (non-blocking)
  setCache(key, freshData, ttl).catch((err) => {
    console.error("Failed to cache data:", err.message);
  });

  return { data: freshData, fromCache: false };
};

export {
  initRedis,
  getClient,
  isRedisConnected,
  testConnection,
  CACHE_KEYS,
  CACHE_TTL,
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,
  invalidateAllDashboardCache,
  invalidateAdminDashboardCache,
  invalidateBuyerDashboardCache,
  invalidateSellerDashboardCache,
  cacheWrapper,
};

export default {
  initRedis,
  getClient,
  isRedisConnected,
  testConnection,
  CACHE_KEYS,
  CACHE_TTL,
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,
  invalidateAllDashboardCache,
  invalidateAdminDashboardCache,
  invalidateBuyerDashboardCache,
  invalidateSellerDashboardCache,
  cacheWrapper,
};
