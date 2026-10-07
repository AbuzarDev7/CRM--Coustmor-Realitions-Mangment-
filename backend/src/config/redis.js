import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();
export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      console.warn("Redis: max reconnection attempts reached.");
      return null; // stop reconnecting indefinitely
    }
    return Math.min(times * 500, 3000);
  }
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});



redis.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

export default redis;
