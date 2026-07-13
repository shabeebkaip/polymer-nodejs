import { Redis } from "@upstash/redis";
import { config } from "../config/config.js";

/**
 * Redis Client Utility (Upstash HTTP-based)
 * Provides caching functionality for the application
 */

let redisClient = null;
let isConnected = false;

// ponytail: in-memory fallback is single-process only; revive Upstash for multi-instance deployments.
let _redisDown = false;      // latched true on first network failure — stops all retry attempts
let _redisDownLogged = false; // log the unreachable condition exactly once

const _memCache = new Map(); // { key -> { value, expiresAt: ms } }

const _memSet = (k, data, ttl) => {
  _memCache.set(k, { value: data, expiresAt: Date.now() + ttl * 1000 });
};

const _memGet = (k) => {
  const entry = _memCache.get(k);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _memCache.delete(k); return null; }
  return entry.value;
};

const _memDel = (k) => _memCache.delete(k);

const _markDown = (err) => {
  _redisDown = true;
  if (!_redisDownLogged) {
    _redisDownLogged = true;
    console.warn(`[cache] Redis unreachable (${err.message}); using in-memory fallback for this process lifetime.`);
  }
};

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
  if (_redisDown || !isConnected || !redisClient) {
    _memSet(key, data, ttl);
    return true;
  }
  try {
    await redisClient.set(key, JSON.stringify(data), { ex: ttl });
    return true;
  } catch (error) {
    _markDown(error);
    _memSet(key, data, ttl);
    return true;
  }
};

/**
 * Get cache
 * @param {string} key - Cache key
 */
const getCache = async (key) => {
  if (_redisDown || !isConnected || !redisClient) {
    return _memGet(key);
  }
  try {
    const data = await redisClient.get(key);
    if (data) {
      // Upstash may return parsed object or string
      return typeof data === "string" ? JSON.parse(data) : data;
    }
    return null;
  } catch (error) {
    _markDown(error);
    return _memGet(key);
  }
};

/**
 * Delete cache
 * @param {string} key - Cache key
 */
const deleteCache = async (key) => {
  _memDel(key); // always clean local mem too
  if (_redisDown || !isConnected || !redisClient) return true;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    _markDown(error);
    return true;
  }
};

/**
 * Delete cache by pattern
 * @param {string} pattern - Key pattern (e.g., "dashboard:*")
 */
const deleteCacheByPattern = async (pattern) => {
  // purge matching keys from local mem fallback
  const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
  for (const k of _memCache.keys()) {
    if (regex.test(k)) _memCache.delete(k);
  }
  if (_redisDown || !isConnected || !redisClient) return true;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    _markDown(error);
    return true;
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
