import { NextResponse, type NextRequest } from "next/server";

// ─── Simple in-edge rate limiter ─────────────────────────────────────────────
// Note: For multi-instance production, swap this Map for Upstash Redis:
// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";
const rateMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 30;       // requests per window
const WINDOW_MS  = 60_000;   // 1 minute window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

// Clean up old entries every ~500 requests to prevent memory leak
let cleanupCounter = 0;
function maybeCleanup() {
  if (++cleanupCounter % 500 !== 0) return;
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, val] of rateMap.entries()) {
    if (val.windowStart < cutoff) rateMap.delete(key);
  }
}

// ─── Domain/Brand slug validation ────────────────────────────────────────────
// FIX I4: Reject malicious or malformed slugs before any upstream fetch
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/i;
const BRAND_RE  = /^[a-z0-9][a-z0-9\s-]{0,60}$/i;
const MAX_SLUG_LEN = 100;

export function validateSlug(slug: string): { valid: boolean; type: "domain" | "brand" | null } {
  if (!slug || slug.length > MAX_SLUG_LEN) return { valid: false, type: null };
  const clean = decodeURIComponent(slug).toLowerCase().trim();
  if (DOMAIN_RE.test(clean)) return { valid: true, type: "domain" };
  if (BRAND_RE.test(clean))  return { valid: true, type: "brand" };
  return { valid: false, type: null };
}

// ─── Reserved paths that are not [slug] routes ────────────────────────────────
const RESERVED = new Set(["dropping-today", "api", "sitemap.xml", "robots.txt", "_next", "favicon.svg"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept dynamic [slug] routes
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return NextResponse.next();
  const slug = segments[0];
  if (RESERVED.has(slug)) return NextResponse.next();

  // ── Rate limiting ──
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  maybeCleanup();

  if (isRateLimited(ip)) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-RateLimit-Limit": String(RATE_LIMIT),
        },
      }
    );
  }

  // ── Slug validation ──
  const { valid } = validateSlug(slug);
  if (!valid) {
    return NextResponse.redirect(new URL(`/?invalid=${encodeURIComponent(slug)}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg|api/).*)",
  ],
};
