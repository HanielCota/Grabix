import { Redis } from "@upstash/redis";

// Fixed-window limiter. Uses Upstash Redis (shared across all instances) when
// configured, otherwise falls back to an in-memory window that is per-instance
// — fine for low traffic, but set UPSTASH_REDIS_REST_* in production for a
// global limit. The limiter fails open: if Redis errors, traffic is allowed
// (via the in-memory path) rather than blocked.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const CLEANUP_INTERVAL = 5 * 60_000;

export interface RateResult {
  limited: boolean;
  remaining: number;
  resetAt: number;
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// ─── In-memory fallback ───

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

function memCheck(ip: string, now: number): RateResult {
  if (now - lastCleanup >= CLEANUP_INTERVAL) {
    lastCleanup = now;
    for (const [key, b] of buckets) {
      if (now > b.resetAt) buckets.delete(key);
    }
  }

  const bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + WINDOW_MS;
    buckets.set(ip, { count: 1, resetAt });
    return { limited: false, remaining: MAX_REQUESTS - 1, resetAt };
  }

  bucket.count++;
  return {
    limited: bucket.count > MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - bucket.count),
    resetAt: bucket.resetAt,
  };
}

// ─── Distributed (Upstash) ───

async function redisCheck(ip: string, now: number): Promise<RateResult> {
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const resetAt = windowStart + WINDOW_MS;
  const key = `rl:${ip}:${windowStart}`;

  // biome-ignore lint/style/noNonNullAssertion: only called when redis is set
  const count = await redis!.incr(key);
  if (count === 1) {
    // biome-ignore lint/style/noNonNullAssertion: only called when redis is set
    await redis!.expire(key, Math.ceil(WINDOW_MS / 1000));
  }

  return {
    limited: count > MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - count),
    resetAt,
  };
}

export async function checkRateLimit(ip: string): Promise<RateResult> {
  const now = Date.now();
  if (redis) {
    try {
      return await redisCheck(ip, now);
    } catch {
      // Redis unavailable — degrade to in-memory rather than blocking everyone.
      return memCheck(ip, now);
    }
  }
  return memCheck(ip, now);
}

export const RATE_LIMIT = { WINDOW_MS, MAX_REQUESTS };
