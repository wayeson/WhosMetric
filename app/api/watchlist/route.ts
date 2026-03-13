/**
 * GET  /api/watchlist         → list watched domains
 * POST /api/watchlist         → add domain  { domain: string }
 * DELETE /api/watchlist?domain=x → remove domain
 *
 * Storage: signed JWT stored in an HttpOnly SameSite=Strict cookie.
 * Zero database required — fits entirely in the cookie payload.
 * Max 50 domains per user (cookie size limit ~4KB).
 */

import { NextRequest, NextResponse } from "next/server";
import { classifySlug }              from "@/lib/validate";

const COOKIE_NAME = "pk_watchlist";
const MAX_DOMAINS = 50;
const COOKIE_TTL  = 60 * 60 * 24 * 365; // 1 year in seconds

// ── Simple HMAC sign/verify ────────────────────────────────────────────────
// Uses Web Crypto API (available in Next.js Edge Runtime)

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.WATCHLIST_SECRET || "whosmetric-watchlist-dev-secret-change-me";
  const enc    = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const b64 = Buffer.from(sig).toString("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${b64}`;
}

async function verify(token: string): Promise<string[] | null> {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;

    const key     = await getKey();
    const enc     = new TextEncoder();
    const sigBuf  = Buffer.from(sigB64, "base64url");
    const valid   = await crypto.subtle.verify("HMAC", key, sigBuf, enc.encode(payloadB64));
    if (!valid) return null;

    const raw = Buffer.from(payloadB64, "base64url").toString("utf-8");
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

function cookieHeader(value: string, maxAge: number): string {
  const secure  = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict${secure}`;
}

// ── Handlers ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const token   = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const domains = token ? (await verify(token)) ?? [] : [];
  return NextResponse.json({ domains, count: domains.length });
}

export async function POST(req: NextRequest) {
  let body: { domain?: string };
  try { body = await req.json(); } catch { body = {}; }

  const raw        = (body.domain ?? "").trim().toLowerCase();
  const classified = classifySlug(raw);

  if (!classified || classified.type !== "domain") {
    return NextResponse.json({ error: "Invalid domain." }, { status: 422 });
  }

  const token   = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const domains = token ? (await verify(token)) ?? [] : [];

  if (domains.includes(classified.value)) {
    return NextResponse.json({ domains, message: "Already watching." });
  }
  if (domains.length >= MAX_DOMAINS) {
    return NextResponse.json({ error: `Watchlist full (max ${MAX_DOMAINS}).` }, { status: 400 });
  }

  const next    = [...domains, classified.value];
  const signed  = await sign(JSON.stringify(next));
  const res     = NextResponse.json({ domains: next, added: classified.value });
  res.headers.set("Set-Cookie", cookieHeader(signed, COOKIE_TTL));
  return res;
}

export async function DELETE(req: NextRequest) {
  const domain   = (req.nextUrl.searchParams.get("domain") ?? "").trim().toLowerCase();
  const token    = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const domains  = token ? (await verify(token)) ?? [] : [];
  const next     = domains.filter(d => d !== domain);
  const signed   = await sign(JSON.stringify(next));
  const res      = NextResponse.json({ domains: next, removed: domain });
  res.headers.set("Set-Cookie", cookieHeader(signed, COOKIE_TTL));
  return res;
}
