import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMIT } from "@/server/rate-limit";

// ─── Allowed methods per route ───

const API_METHODS: Record<string, string> = {
  "/api/analyze": "POST",
  "/api/download": "POST",
  "/api/download-zip": "POST",
  "/api/extract/deep": "POST",
};

// ─── Proxy ───

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

  // Rate limiting. Prefer the platform-set x-real-ip (the trusted edge writes it
  // and the client can't forge it); fall back to the left-most x-forwarded-for
  // only when x-real-ip is absent. Using the left-most XFF alone is spoofable
  // behind a proxy that appends the real client IP.
  const ip =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const { limited, remaining, resetAt } = await checkRateLimit(ip);

  if (limited) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Muitas requisicoes. Tenta de novo em breve." } },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(RATE_LIMIT.MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const response = NextResponse.next();

  // Rate limit headers
  response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT.MAX_REQUESTS));
  response.headers.set("X-RateLimit-Remaining", String(remaining));

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
