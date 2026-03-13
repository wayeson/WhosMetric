import { NextResponse, type NextRequest } from "next/server";

// ─── Rate limiting ────────────────────────────────────────────────────────────
// In-process sliding window. For multi-replica Railway deploys, swap for
// Upstash Redis Ratelimit (see README — 1-hour change once keys are set).

const rateMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT    = 30;     // requests per window
const WINDOW_MS     = 60_000; // 1 minute
// API routes have a stricter per-minute limit
const API_RATE_LIMIT = 10;

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

function isRateLimited(ip: string, limit: number): boolean {
  const now   = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  return entry.count > limit;
}

// Cleanup every ~500 calls to prevent unbounded growth
let cleanupCounter = 0;
function maybeCleanup() {
  if (++cleanupCounter % 500 !== 0) return;
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, val] of rateMap) {
    if (val.windowStart < cutoff) rateMap.delete(key);
  }
}

// ─── Slug validation ──────────────────────────────────────────────────────────

const DOMAIN_RE   = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/i;
const BRAND_RE    = /^[a-z0-9][a-z0-9\s-]{0,60}$/i;
const MAX_SLUG    = 100;

function validateSlug(slug: string): boolean {
  if (!slug || slug.length > MAX_SLUG) return false;
  const clean = decodeURIComponent(slug).toLowerCase().trim();
  return DOMAIN_RE.test(clean) || BRAND_RE.test(clean);
}

// ─── Reserved top-level paths (not [slug] routes) ─────────────────────────────

const RESERVED = new Set([
  "dropping-today", "bulk", "watchlist",
  "api", "sitemap.xml", "robots.txt", "_next", "favicon.svg",
]);

// ─── Security headers added to every response ─────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options":    "nosniff",
  "X-Frame-Options":           "DENY",
  "X-XSS-Protection":          "1; mode=block",
  "Referrer-Policy":           "strict-origin-when-cross-origin",
  "Permissions-Policy":        "camera=(), microphone=(), geolocation=()",
};

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip           = getIP(request);

  maybeCleanup();

  // ── API routes: stricter rate limit, security headers only ──────────────
  if (pathname.startsWith("/api/")) {
    // Skip auth/internal Next paths
    if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next")) {
      return NextResponse.next();
    }

    if (isRateLimited(`api:${ip}`, API_RATE_LIMIT)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many API requests. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type":     "application/json",
            "Retry-After":      "60",
            "X-RateLimit-Limit": String(API_RATE_LIMIT),
            ...SECURITY_HEADERS,
          },
        }
      );
    }

    const res = NextResponse.next();
    Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // ── Page routes: full rate limit + slug validation ───────────────────────
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return NextResponse.next();
  const slug = segments[0];
  if (RESERVED.has(slug.toLowerCase())) return NextResponse.next();

  // Page rate limit (30/min)
  if (isRateLimited(ip, RATE_LIMIT)) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type":      "application/json",
          "Retry-After":       "60",
          "X-RateLimit-Limit": String(RATE_LIMIT),
        },
      }
    );
  }

  // Slug validation — reject malicious inputs before any fetch
  if (!validateSlug(slug)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("invalid", slug.slice(0, 40));
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg).*)",
  ],
};
