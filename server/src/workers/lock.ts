import redis from "@/config/redis";

const LOCK_TTL_MS = 30000;

export async function acquireLock(jobId: string): Promise<boolean> {
  const key = `job:lock:${jobId}`;
  // ioredis v5+ signature: set(key, value, expiryMode, time, setMode)
  const result = await redis.set(key, "1", "PX", LOCK_TTL_MS, "NX");
  return result === "OK";
}

export async function releaseLock(jobId: string): Promise<void> {
  const key = `job:lock:${jobId}`;
  await redis.del(key);
}
