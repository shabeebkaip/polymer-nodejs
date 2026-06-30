import crypto from "node:crypto";
import { setCache, getCache, deleteCache } from "./redis.js";

const TTL_SECONDS = 2 * 60 * 60; // 2h
const PREFIX = "ai:session:";

const key = (id) => `${PREFIX}${id}`;

// In-memory fallback — used when Redis is unavailable.
// Sessions survive only for the lifetime of the process (acceptable for staging).
const mem = new Map();

const memSet = (k, value) => {
  mem.set(k, value);
  setTimeout(() => mem.delete(k), TTL_SECONDS * 1000);
};

export const createSession = async (data) => {
  const id = `ses_${crypto.randomBytes(4).toString("hex")}`;
  const payload = { ...data, createdAt: Date.now() };
  const stored = await setCache(key(id), payload, TTL_SECONDS);
  if (!stored) memSet(key(id), payload);
  return id;
};

export const getSession = async (id) => {
  const fromRedis = await getCache(key(id));
  if (fromRedis !== null) return fromRedis;
  return mem.get(key(id)) ?? null;
};

export const updateSession = async (id, patch) => {
  const session = await getSession(id);
  if (!session) return null;
  const next = { ...session, ...patch };
  const stored = await setCache(key(id), next, TTL_SECONDS);
  if (!stored) memSet(key(id), next);
  return next;
};

export const deleteSession = async (id) => {
  mem.delete(key(id));
  return deleteCache(key(id));
};
