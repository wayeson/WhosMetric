/**
 * GET /api/rdap?domain=stripe.com
 *
 * Server-side RDAP proxy. Keeps all upstream calls on the server so the
 * client never talks to rdap.org directly (avoids CORS issues and leaks).
 *
 * Validates + sanitises the domain param before forwarding.
 * Rate-limited at the edge by middleware.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { lookupDomain, checkTLDAvailability } from "@/lib/rdap";
import { classifySlug, extractSLD }           from "@/lib/validate";
import { cacheGet, cacheSet }                 from "@/lib/cache";

const CORS = {
  "Access-Control-Allow-Origin":  process.env.NEXT_PUBLIC_APP_URL || "https://whosmetric.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control":                "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const raw = (searchParams.get("domain") ?? "").trim().toLowerCase();

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!raw) {
    return NextResponse.json({ error: "Missing domain parameter." }, { status: 400, headers: CORS });
  }

  const classified = classifySlug(raw);
  if (!classified || classified.type !== "domain") {
    return NextResponse.json({ error: "Invalid domain name." }, { status: 422, headers: CORS });
  }

  const domain = classified.value;
  const sld    = extractSLD(domain);
  const cacheKey = `api:rdap:${domain}`;

  // ── Cache hit ─────────────────────────────────────────────────────────────
  const cached = await cacheGet<{ rdap: unknown; tlds: unknown }>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true }, { status: 200, headers: CORS });
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  try {
    const [rdap, tlds] = await Promise.all([
      lookupDomain(domain),
      checkTLDAvailability(sld),
    ]);

    const payload = { rdap, tlds, cached: false };
    await cacheSet(cacheKey, payload, 3600 * 1000);

    return NextResponse.json(payload, { status: 200, headers: CORS });
  } catch (err) {
    console.error("[api/rdap] error:", err);
    return NextResponse.json({ error: "RDAP lookup failed." }, { status: 502, headers: CORS });
  }
}
