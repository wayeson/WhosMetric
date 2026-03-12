import { cacheGet, cacheSet } from "./cache";
import { sanitizeForPrompt } from "./validate";
import type {
  DomainIntelligence,
  BrandIntelligence,
  DroppingDomain,
  RecentlyDroppedDomain,
  DomainSaleRecord,
  DomainNewsItem,
  TLDTrendItem,
  RDAPResult,
} from "./types";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL         = "claude-sonnet-4-20250514";

// ─── Core call ────────────────────────────────────────────────────────────────

interface ClaudeOpts {
  system: string;
  prompt: string;
  useSearch?: boolean;
  maxTokens?: number;
}

async function callClaude(opts: ClaudeOpts): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[claude] ANTHROPIC_API_KEY not set");
    return null;
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: opts.maxTokens ?? 1200,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  };
  if (opts.useSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) { console.warn("[claude] Rate limited"); return null; }
    if (!res.ok) { console.error(`[claude] API ${res.status}`); return null; }

    const data = await res.json();
    return (data.content as Array<{ type: string; text?: string }>)
      .filter(b => b.type === "text")
      .map(b => b.text ?? "")
      .join("\n");
  } catch (err) {
    console.error("[claude] fetch error:", err);
    return null;
  }
}

async function callClaudeJSON<T>(opts: ClaudeOpts): Promise<T | null> {
  const raw = await callClaude(opts);
  if (!raw) return null;
  try {
    // Strip any accidental markdown fences
    const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const match = clean.match(/[\[{][\s\S]*[\]}]/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch (err) {
    console.error("[claude] JSON parse error:", err);
    return null;
  }
}

// ─── Domain Intelligence ──────────────────────────────────────────────────────
// RDAP passed in — called exactly once, no double API usage

export async function getDomainIntelligence(
  domain: string,
  rdap: RDAPResult | null
): Promise<DomainIntelligence | null> {
  const key = `intel:${domain.toLowerCase()}`;
  const cached = await cacheGet<DomainIntelligence>(key);
  if (cached) return cached;

  const safeDomain = sanitizeForPrompt(domain);
  const safeSLD    = safeDomain.split(".")[0];

  const ctx = rdap?.found
    ? `Registered since ${rdap.registered?.split("T")[0] ?? "unknown"} by registrar "${rdap.registrar}". Status: ${rdap.status?.join(", ") || "active"}.`
    : "Currently available for registration.";

  const intel = await callClaudeJSON<DomainIntelligence>({
    system: "You are a domain investment and brand strategy expert. Return ONLY valid JSON — no markdown, no backticks, no preamble, no explanation.",
    prompt: `Analyze domain "${safeDomain}". ${ctx}
Search for real comparable domain sales to estimate market value accurately.

Return ONLY this JSON object:
{
  "estimatedValue": 4500,
  "brandScore": 82,
  "length": 88,
  "pronunciation": 84,
  "memorability": 80,
  "marketFit": 78,
  "category": "Tech/SaaS",
  "verdict": "Two concise sentences covering brand quality and investment potential.",
  "strengths": ["Short and crisp", "AI era keyword"],
  "weaknesses": ["Competitive .com market"],
  "comparables": [
    {"domain": "relay.ai", "price": 75000, "year": "2024"}
  ],
  "suggestions": [
    {"domain": "${safeSLD}hub.io", "reason": "Hub suffix popular with dev tools"},
    {"domain": "get${safeSLD}.com", "reason": "Action prefix, high conversion intent"},
    {"domain": "${safeSLD}labs.ai", "reason": "Labs variant for AI/R&D positioning"},
    {"domain": "try${safeSLD}.co", "reason": "Conversion-focused trial domain"}
  ]
}`,
    useSearch: true,
    maxTokens: 1200,
  });

  if (intel) await cacheSet(key, intel, 1800 * 1000);
  return intel;
}

// ─── Brand Intelligence ───────────────────────────────────────────────────────

export async function getBrandIntelligence(brand: string): Promise<BrandIntelligence | null> {
  const key = `brand:${brand.toLowerCase()}`;
  const cached = await cacheGet<BrandIntelligence>(key);
  if (cached) return cached;

  const safe = sanitizeForPrompt(brand);
  const sld  = safe.split(".")[0];

  const intel = await callClaudeJSON<BrandIntelligence>({
    system: "Domain intelligence expert. Return ONLY valid JSON — no markdown, no backticks.",
    prompt: `Search for domain portfolio and company info for brand "${safe}".
Return ONLY this JSON:
{
  "companyName": "Full Company Name",
  "industry": "Software / SaaS",
  "description": "One to two sentences describing what this company does.",
  "primaryDomain": "${sld}.com",
  "knownDomains": [
    {"domain": "${sld}.io", "likely": true, "note": "Developer portal"},
    {"domain": "${sld}.co", "likely": false, "note": "Alternative TLD"}
  ],
  "suggestedKeywords": ["related", "keyword"],
  "similarBrands": ["competitor1", "competitor2"]
}`,
    useSearch: true,
    maxTokens: 900,
  });

  if (intel) await cacheSet(key, intel, 3600 * 1000);
  return intel;
}

// ─── Dropping Domains (dropping-today page) ───────────────────────────────────

export async function getDroppingDomains(): Promise<DroppingDomain[] | null> {
  const key = "dropping:today";
  const cached = await cacheGet<DroppingDomain[]>(key);
  if (cached) return cached;

  const domains = await callClaudeJSON<DroppingDomain[]>({
    system: "Domain market expert. Return ONLY valid JSON — no markdown, no backticks.",
    prompt: `Search for domains expiring or dropping today or in the next 48 hours from GoDaddy Auctions, NameJet, Sedo, ExpiredDomains.net, or similar services.

Return a JSON array of up to 15 domains:
[
  {
    "domain": "example.com",
    "tld": ".com",
    "age": "12 years",
    "expiry": "2026-03-15",
    "estimatedValue": 3200,
    "category": "Tech",
    "registrar": "GoDaddy",
    "backlinks": 142,
    "previousOwner": "Tech Company Inc"
  }
]

Prioritize domains with real market value. Return ONLY the JSON array.`,
    useSearch: true,
    maxTokens: 1400,
  });

  if (domains) await cacheSet(key, domains, 3600 * 1000);
  return domains;
}

// ─── Recently Dropped (homepage section) ─────────────────────────────────────

export async function getRecentlyDropped(): Promise<RecentlyDroppedDomain[] | null> {
  const key = "recently-dropped:week";
  const cached = await cacheGet<RecentlyDroppedDomain[]>(key);
  if (cached) return cached;

  const data = await callClaudeJSON<RecentlyDroppedDomain[]>({
    system: "Domain market expert. Return ONLY valid JSON — no markdown, no backticks.",
    prompt: `Search for recently expired or dropped domain names from the past 7 days. Sources: ExpiredDomains.net, GoDaddy Auctions, NameJet, domain drop lists.

Return a JSON array of exactly 10 recently dropped domains:
[
  {
    "domain": "example.com",
    "tld": ".com",
    "length": 7,
    "dropTime": "2026-03-10T14:00:00Z",
    "estimatedValue": 2400,
    "category": "Tech",
    "backlinks": 84
  }
]

Use real recently dropped domains. Prioritize domains with genuine market value. Return ONLY the JSON array.`,
    useSearch: true,
    maxTokens: 1400,
  });

  if (data) await cacheSet(key, data, 3600 * 1000);
  return data;
}

// ─── Recent Domain Sales (homepage section) ───────────────────────────────────

export async function getRecentSales(): Promise<DomainSaleRecord[] | null> {
  const key = "sales:recent";
  const cached = await cacheGet<DomainSaleRecord[]>(key);
  if (cached) return cached;

  const data = await callClaudeJSON<DomainSaleRecord[]>({
    system: "Domain market expert. Return ONLY valid JSON — no markdown, no backticks.",
    prompt: `Search for the most recent notable domain name sales from the past 30 days. Check NameBio, DN Journal, Sedo, Afternic, GoDaddy Auctions.

Return a JSON array of 10 recent sales, ordered by most recent first:
[
  {
    "domain": "relay.com",
    "price": 85000,
    "saleDate": "2026-02-28",
    "marketplace": "Afternic",
    "category": "Tech",
    "notes": "Short brandable .com"
  }
]

Use verified real sales. Return ONLY the JSON array.`,
    useSearch: true,
    maxTokens: 1200,
  });

  if (data) await cacheSet(key, data, 3600 * 1000);
  return data;
}

// ─── Domain News (homepage section) ──────────────────────────────────────────

export async function getDomainNews(): Promise<DomainNewsItem[] | null> {
  const key = "news:recent";
  const cached = await cacheGet<DomainNewsItem[]>(key);
  if (cached) return cached;

  const data = await callClaudeJSON<DomainNewsItem[]>({
    system: "Domain industry analyst. Return ONLY valid JSON — no markdown, no backticks.",
    prompt: `Search for the latest domain industry news from the past 14 days. Sources: Domain Incite, The Domains, Domain Name Wire, NamePros, CircleID, ICANN announcements.

Return a JSON array of 8 news items:
[
  {
    "title": "ICANN Approves New TLD Applications for 2026",
    "source": "Domain Incite",
    "date": "2026-03-10",
    "summary": "One sentence summary of the news item.",
    "url": "https://domainincite.com/article",
    "category": "Policy"
  }
]

Categories: Policy, Market, Technology, ICANN, Investment.
Use real recent news. Return ONLY the JSON array.`,
    useSearch: true,
    maxTokens: 1200,
  });

  if (data) await cacheSet(key, data, 1800 * 1000);
  return data;
}

// ─── TLD Trends (homepage section + ticker) ───────────────────────────────────

export async function getTLDTrends(): Promise<TLDTrendItem[] | null> {
  const key = "tld:trends";
  const cached = await cacheGet<TLDTrendItem[]>(key);
  if (cached) return cached;

  const data = await callClaudeJSON<TLDTrendItem[]>({
    system: "Domain market analyst. Return ONLY valid JSON — no markdown, no backticks.",
    prompt: `Search for current TLD registration trends and statistics for 2026. Check ICANN stats, Verisign reports, nTLDStats, or domain registrar trend data.

Return a JSON array of 14 TLDs:
[
  {
    "tld": ".ai",
    "registrations": 850000,
    "change30d": 34.2,
    "avgPrice": 89,
    "trend": "up",
    "category": "Technology",
    "notes": "Dominant AI brand extension"
  }
]

trend must be "up", "down", or "stable". Return ONLY the JSON array.`,
    useSearch: true,
    maxTokens: 1000,
  });

  if (data) await cacheSet(key, data, 86400 * 1000); // 24h — changes slowly
  return data;
}
