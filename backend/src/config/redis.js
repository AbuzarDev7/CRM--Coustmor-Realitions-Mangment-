import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const rawUrl = process.env.REDIS_URL || "redis://localhost:6379";
let isConnected = false;
let warningLogged = false;

// Fallback in-memory cache for high availability when Redis server is offline
const memoryCache = new Map();

export const redis = new Redis(rawUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 3000,
  retryStrategy(times) {
    if (times > 3) {
      if (!warningLogged) {
        console.warn(
          `⚠️ [Redis] Connection could not be established at ${rawUrl.replace(/:[^:@]+@/, ":****@")}. Falling back gracefully to in-memory cache.`
        );
        warningLogged = true;
      }
      return null; // Stop reconnecting after 3 tries to avoid log spam
    }
    return Math.min(times * 600, 2000);
  }
});

redis.on("connect", () => {
  isConnected = true;
  warningLogged = false;
  console.log("✅ Connected to Redis cache service");
});

redis.on("ready", () => {
  isConnected = true;
});

redis.on("error", (err) => {
  isConnected = false;
  // Log only the first connection error, prevent spamming logs
  if (!warningLogged) {
    console.warn(`⚠️ [Redis Warning] ${err.message}. Seamless in-memory fallback active.`);
    warningLogged = true;
  }
});

redis.on("close", () => {
  isConnected = false;
});

// Resilient cache operations (Transparently uses Redis if online, otherwise in-memory Map)
export const getCache = async (key) => {
  if (isConnected) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      // Fallback on read failure
    }
  }
  const cached = memoryCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt && cached.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return cached.value;
};

export const setCache = async (key, value, ttlSeconds = 300) => {
  if (isConnected) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Ignore write failure and continue to memory
    }
  }
  memoryCache.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
  });
};

export const delCache = async (key) => {
  if (isConnected) {
    try {
      await redis.del(key);
    } catch {}
  }
  memoryCache.delete(key);
};

export const getRedisHealth = () => {
  const sanitizedUrl = rawUrl.replace(/:[^:@]+@/, ":****@");
  return {
    status: isConnected ? "connected" : "in_memory_fallback",
    connected: isConnected,
    url: sanitizedUrl,
    inMemoryEntries: memoryCache.size
  };
};

// Attempt initial connection asynchronously without blocking server startup
redis.connect().catch(() => {
  // Handled by retryStrategy and error event
});

export default redis;

