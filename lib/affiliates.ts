import type { Affiliate, AffiliateLink } from "./types";

// FIX I8: Use a closure-scoped variable with explicit reset support.
// Module-level singletons break in edge runtime and HMR. This version:
// - Only reads fs in Node.js runtime (not edge)
// - Provides a reset() for testing
// - Falls back to hardcoded defaults if file not found

const FALLBACK_AFFILIATES: Affiliate[] = [
  { name: "NAMECHEAP",  urlTemplate: "https://namecheap.pxf.io/c/AFFILIATEID/lookup?domain={domain}" },
  { name: "DYNADOT",    urlTemplate: "https://www.dynadot.com/domain/search?domain={domain}&ref=AFFILIATEID" },
  { name: "GODADDY",    urlTemplate: "https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck={domain}" },
  { name: "PORKBUN",    urlTemplate: "https://porkbun.com/checkout/search?q={domain}" },
  { name: "SPACESHIP",  urlTemplate: "https://spaceship.domains/register?domain={domain}&ref=AFFILIATEID" },
];

let _parsed: Affiliate[] | null = null;

function parseAffiliateFile(raw: string): Affiliate[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      if (idx === -1) return null;
      const name        = l.slice(0, idx).trim().toUpperCase();
      const urlTemplate = l.slice(idx + 1).trim();
      if (!name || !urlTemplate.includes("{domain}")) return null;
      return { name, urlTemplate };
    })
    .filter((a): a is Affiliate => a !== null);
}

export function getAffiliates(): Affiliate[] {
  if (_parsed) return _parsed;

  // Edge runtime: fs is not available
  if (typeof process === "undefined" || process.versions?.node === undefined) {
    _parsed = FALLBACK_AFFILIATES;
    return _parsed;
  }

  try {
    // Dynamic require to avoid edge runtime bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs   = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require("path") as typeof import("path");
    const filePath = path.join(process.cwd(), "affiliates.txt");
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = parseAffiliateFile(raw);
    _parsed = parsed.length > 0 ? parsed : FALLBACK_AFFILIATES;
  } catch {
    _parsed = FALLBACK_AFFILIATES;
  }

  return _parsed;
}

/** Force re-read of affiliates.txt (useful after hot-reload or testing). */
export function resetAffiliateCache(): void {
  _parsed = null;
}

/** Replace {domain} placeholder in a URL template. */
export function resolveAffiliateUrl(urlTemplate: string, domain: string): string {
  return urlTemplate.replace(/\{domain\}/g, encodeURIComponent(domain));
}

/** Get all resolved affiliate links for a domain. */
export function getAffiliateLinks(domain: string): AffiliateLink[] {
  return getAffiliates().map(({ name, urlTemplate }) => ({
    name,
    url: resolveAffiliateUrl(urlTemplate, domain),
  }));
}
