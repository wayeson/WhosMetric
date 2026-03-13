/**
 * GET /api/search?q=stripe.com
 *
 * Combined search endpoint: validates the query, returns immediate RDAP
 * data + TLD availability without blocking on AI. Clients can call this
 * first for instant results, then hit /api/intel for the AI layer.
 *
 * This endpoint powers the mini SearchBar in the header (compact mode).
 */

import { NextRequest, NextResponse } from "next/server";
import { lookupDomain, checkTLDAvailability } from "@/lib/rdap";
import { classifySlug, extractSLD }           from "@/lib/validate";
import { cacheGet, cacheSet }                 from "@/lib/cache";

const CORS = {
  "Access-Control-Allow-Origin":  process.env.NEXT_PUBLIC_APP_URL || "https://whosmetric.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control":                "public, s-maxage=1800, stale-while-revalidate=3600",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const raw = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!raw || raw.length > 100) {
    return NextResponse.json({ error: "Invalid query." }, { status: 400, headers: CORS });
  }

  const classified = classifySlug(raw);
  if (!classified) {
    return NextResponse.json({ error: "Could not parse as domain or brand." }, { status: 422, headers: CORS });
  }

  const cacheKey = `api:search:${classified.value}`;
  const cached   = await cacheGet<unknown>(cacheKey);
  if (cached) return NextResponse.json({ ...cached as object, cached: true }, { headers: CORS });

  if (classified.type === "domain") {
    const sld = extractSLD(classified.value);
    const [rdap, tlds] = await Promise.allSettled([
      lookupDomain(classified.value),
      checkTLDAvailability(sld),
    ]);

    const payload = {
      type:   "domain",
      value:  classified.value,
      rdap:   rdap.status  === "fulfilled" ? rdap.value  : null,
      tlds:   tlds.status  === "fulfilled" ? tlds.value  : [],
      cached: false,
    };

    await cacheSet(cacheKey, payload, 1800 * 1000);
    return NextResponse.json(payload, { headers: CORS });
  }

  // Brand — just return the classified value so the client knows it's a brand search
  const payload = { type: "brand", value: classified.value, cached: false };
  await cacheSet(cacheKey, payload, 900 * 1000);
  return NextResponse.json(payload, { headers: CORS });
}
