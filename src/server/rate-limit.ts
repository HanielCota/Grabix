import { Redis } from "@upstash/redis";

// Fixed-window limiter. Uses Upstash Redis (shared across all instances) when
// configured, otherwise falls back to an in-memory window that is per-instance
// - fine for low traffic, but set UPSTASH_REDIS_REST_* in production for a
// global limit. The limiter fails open: if Redis errors, traffic is allowed
// (via the in-memory path) rather than blocked.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const CLEANUP_INTERVAL = 5 * 60_000;

export interface RateResult {
  limited: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
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

function memCheck(key: string, now: number, max: number, windowMs: number): RateResult {
  if (now - lastCleanup >= CLEANUP_INTERVAL) {
    lastCleanup = now;
    for (const [k, b] of buckets) {
      if (now > b.resetAt) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { limited: false, remaining: max - 1, resetAt, limit: max };
  }

  bucket.count++;
  return {
    limited: bucket.count > max,
    remaining: Math.max(0, max - bucket.count),
    resetAt: bucket.resetAt,
    limit: max,
  };
}

// ─── Distributed (Upstash) ───

async function redisCheck(id: string, now: number, max: number, windowMs: number): Promise<RateResult> {
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const resetAt = windowStart + windowMs;
  const key = `rl:${id}:${windowStart}`;

  // biome-ignore lint/style/noNonNullAssertion: only called when redis is set
  const count = await redis!.incr(key);
  if (count === 1) {
    // biome-ignore lint/style/noNonNullAssertion: only called when redis is set
    await redis!.expire(key, Math.ceil(windowMs / 1000));
  }

  return {
    limited: count > max,
    remaining: Math.max(0, max - count),
    resetAt,
    limit: max,
  };
}

export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
}

/**
 * Fixed-window rate limit for an arbitrary key (an IP, or e.g. `analyze:<userId>`).
 * Defaults to the global per-IP budget; pass opts for a per-route/per-user budget.
 */
export async function checkRateLimit(key: string, opts?: RateLimitOptions): Promise<RateResult> {
  const max = opts?.max ?? MAX_REQUESTS;
  const windowMs = opts?.windowMs ?? WINDOW_MS;
  const now = Date.now();
  if (redis) {
    try {
      return await redisCheck(key, now, max, windowMs);
    } catch {
      // Redis unavailable - degrade to in-memory rather than blocking everyone.
      return memCheck(key, now, max, windowMs);
    }
  }
  return memCheck(key, now, max, windowMs);
}

export const RATE_LIMIT = { WINDOW_MS, MAX_REQUESTS };
