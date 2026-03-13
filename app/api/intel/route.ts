/**
 * GET /api/intel?domain=stripe.com
 *
 * Server-side AI intelligence proxy. The Anthropic API key lives
 * exclusively here — it is NEVER shipped to the client bundle.
 *
 * Returns cached results when available (1800s TTL).
 * Requires ?domain= to be a valid domain (classified by classifySlug).
 */

import { NextRequest, NextResponse } from "next/server";
import { getDomainIntelligence, getBrandIntelligence } from "@/lib/claude";
import { lookupDomain }                                from "@/lib/rdap";
import { classifySlug }                                from "@/lib/validate";

const CORS = {
  "Access-Control-Allow-Origin":  process.env.NEXT_PUBLIC_APP_URL || "https://whosmetric.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control":                "public, s-maxage=1800, stale-while-revalidate=7200",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const raw = (searchParams.get("domain") ?? "").trim().toLowerCase();

  if (!raw) {
    return NextResponse.json({ error: "Missing domain parameter." }, { status: 400, headers: CORS });
  }

  const classified = classifySlug(raw);
  if (!classified) {
    return NextResponse.json({ error: "Invalid domain or brand." }, { status: 422, headers: CORS });
  }

  try {
    if (classified.type === "domain") {
      // Fetch RDAP first so intelligence has real context
      const rdap  = await lookupDomain(classified.value).catch(() => null);
      const intel = await getDomainIntelligence(classified.value, rdap);
      if (!intel) return NextResponse.json({ error: "AI analysis unavailable." }, { status: 503, headers: CORS });
      return NextResponse.json({ type: "domain", intel }, { status: 200, headers: CORS });
    }

    const intel = await getBrandIntelligence(classified.value);
    if (!intel) return NextResponse.json({ error: "Brand analysis unavailable." }, { status: 503, headers: CORS });
    return NextResponse.json({ type: "brand", intel }, { status: 200, headers: CORS });
  } catch (err) {
    console.error("[api/intel] error:", err);
    return NextResponse.json({ error: "AI analysis failed." }, { status: 500, headers: CORS });
  }
}
