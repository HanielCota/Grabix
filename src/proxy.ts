import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit, type RateLimitOptions } from "@/server/rate-limit";

// ─── Allowed methods per route ───

const API_METHODS: Record<string, string> = {
  "/api/analyze": "POST",
  "/api/download": "POST",
  "/api/download-zip": "POST",
  "/api/extract/deep": "POST",
};

// ─── Per-route rate limit budgets (on top of the global per-IP budget) ───

const ROUTE_LIMITS: Record<string, RateLimitOptions> = {
  "/api/analyze": { max: 30, windowMs: 60_000 },
  "/api/download": { max: 60, windowMs: 60_000 },
  "/api/download-zip": { max: 20, windowMs: 60_000 },
  "/api/extract/deep": { max: 10, windowMs: 60_000 },
};

// ─── Client IP extraction ───
// In production (e.g. Vercel) the edge rewrites x-real-ip and the client cannot
// forge it. We never trust the left-most x-forwarded-for because it is spoofable.
// When x-real-ip is absent we fall back to the right-most x-forwarded-for entry
// (the last proxy that appended the real client IP).

function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();
  if (forwardedFor) {
    const parts = forwardedFor.split(",");
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }

  // NextRequest exposes the connection IP on some runtimes (Node/Vercel).
  const connIp = (request as unknown as { ip?: string }).ip;
  if (connIp) return connIp;

  return "unknown";
}

// ─── Proxy (Next.js 16 middleware convention) ───

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Auth callbacks and provider webhooks manage their own methods and must not
  // be dropped by the per-IP limiter (would break login / lose webhook events).
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  // Block unexpected HTTP methods
  const allowedMethod = API_METHODS[pathname];
  if (allowedMethod && request.method !== allowedMethod && request.method !== "OPTIONS") {
    return NextResponse.json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Metodo nao permitido." } },
      { status: 405, headers: { Allow: allowedMethod } },
    );
  }

  const ip = getClientIp(request);
  const routeLimits = ROUTE_LIMITS[pathname];
  const opts: RateLimitOptions = routeLimits ?? { max: 60, windowMs: 60_000 };
  const { limited, remaining, resetAt, limit } = await checkRateLimit(`ip:${ip}:${pathname}`, opts);

  if (limited) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Muitas requisicoes. Tenta de novo em breve." } },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const response = NextResponse.next();

  // Rate limit headers
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
