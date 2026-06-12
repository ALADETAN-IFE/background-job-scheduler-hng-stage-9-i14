import Redis from "ioredis";
import { ENV } from "./env";
import { logger } from "@/utils";

const redis = new Redis(ENV.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 3) {
      logger.error("Redis", "Max retries reached, giving up");
      return null;
    }
    const delay = Math.min(times * 200, 2000);
    logger.warn("Redis", `Retrying connection in ${delay}ms (attempt ${times})`);
    return delay;
  },
});

redis.on("connect", () => logger.info("Redis", "Connected"));
redis.on("error", (err: Error) => logger.error("Redis", "Connection error", err));

export default redis;
