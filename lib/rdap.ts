import { cacheGet, cacheSet } from "./cache";
import type { RDAPResult, TLDResult } from "./types";

const RDAP_BASE = "https://rdap.org/domain/";
const TLDS      = [".com",".io",".ai",".co",".app",".dev",".xyz",".net",".gg",".org",".tech",".finance"] as const;

// ─── Domain lookup ────────────────────────────────────────────────────────────

export async function lookupDomain(domain: string): Promise<RDAPResult> {
  const key = `rdap:${domain.toLowerCase()}`;
  const cached = await cacheGet<RDAPResult>(key);
  if (cached) return cached;

  let result: RDAPResult;

  try {
    const res = await fetch(
      `${RDAP_BASE}${encodeURIComponent(domain.toLowerCase())}`,
      { signal: AbortSignal.timeout(6000), next: { revalidate: 3600 } }
    );

    if (res.status === 404) {
      result = { found: false, available: true, domain };
      await cacheSet(key, result);
      return result;
    }

    if (!res.ok) {
      result = { found: false, available: null, domain, error: `HTTP ${res.status}` };
      return result; // Don't cache errors
    }

    const d = await res.json();
    const ev = (d.events ?? []) as Array<{ eventAction: string; eventDate: string }>;
    const getDate = (action: string) =>
      ev.find((e) => e.eventAction === action)?.eventDate ?? null;

    const entities = (d.entities ?? []) as Array<{
      roles?: string[];
      vcardArray?: [string, Array<[string, unknown, unknown, string]>];
    }>;

    const registrarEntity = entities.find((e) => e.roles?.includes("registrar"));
    const registrar =
      registrarEntity?.vcardArray?.[1]?.find((v) => v[0] === "fn")?.[3] ?? "Unknown";

    const registrantEntity = entities.find((e) => e.roles?.includes("registrant"));
    const registrantOrg =
      registrantEntity?.vcardArray?.[1]?.find((v) => v[0] === "org")?.[3] ??
      registrantEntity?.vcardArray?.[1]?.find((v) => v[0] === "fn")?.[3] ??
      null;

    result = {
      found: true,
      available: false,
      domain,
      registrar: String(registrar),
      registrantOrg: registrantOrg ? String(registrantOrg) : null,
      registered: getDate("registration"),
      expiry: getDate("expiration"),
      updated: getDate("last changed"),
      status: (d.status ?? []) as string[],
      nameservers: ((d.nameservers ?? []) as Array<{ ldhName?: string }>)
        .map((n) => n.ldhName)
        .filter((n): n is string => Boolean(n)),
      handle: d.handle ?? null,
      port43: d.port43 ?? null,
    };

    await cacheSet(key, result);
    return result;
  } catch (err) {
    return {
      found: false,
      available: null,
      domain,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── TLD availability check ───────────────────────────────────────────────────

export async function checkTLDAvailability(sld: string): Promise<TLDResult[]> {
  const results = await Promise.allSettled(
    TLDS.map(async (tld): Promise<TLDResult> => {
      const domain = sld + tld;
      const key    = `rdap:${domain}`;

      const cached = await cacheGet<RDAPResult>(key);
      if (cached !== null) return { tld, domain, available: cached.available };

      try {
        const r = await fetch(`${RDAP_BASE}${domain}`, {
          signal: AbortSignal.timeout(4500),
          next: { revalidate: 3600 },
        });
        const available = r.status === 404;
        await cacheSet(key, { found: !available, available, domain } as RDAPResult);
        return { tld, domain, available };
      } catch {
        return { tld, domain, available: null };
      }
    })
  );

  return results.map((r, i): TLDResult =>
    r.status === "fulfilled"
      ? r.value
      : { tld: TLDS[i], domain: sld + TLDS[i], available: null }
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function domainAge(registered: string | null | undefined): string | null {
  if (!registered) return null;
  const ms    = Date.now() - new Date(registered).getTime();
  const years = ms / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 1) return `${Math.round(years * 12)} months`;
  return `${years.toFixed(1)} years`;
}

const DNS_SIGNATURES: Array<[string, string]> = [
  ["cloudflare",          "Cloudflare"],
  ["awsdns",              "Amazon Route 53"],
  ["googledomains",       "Google Domains"],
  ["google",              "Google DNS"],
  ["vercel",              "Vercel"],
  ["netlify",             "Netlify"],
  ["dynadot",             "Dynadot"],
  ["registrar-servers",   "Namecheap"],
  ["namecheap",           "Namecheap"],
  ["domaincontrol",       "GoDaddy"],
  ["godaddy",             "GoDaddy"],
  ["squarespace",         "Squarespace"],
  ["shopify",             "Shopify"],
  ["automattic",          "WordPress.com"],
  ["siteground",          "SiteGround"],
  ["bluehost",            "Bluehost"],
  ["fastly",              "Fastly"],
  ["hetzner",             "Hetzner"],
  ["digitalocean",        "DigitalOcean"],
  ["linode",              "Akamai Cloud"],
  ["azure",               "Azure DNS"],
];

export function detectDNSProvider(nameservers: string[]): string {
  const joined = nameservers.map((n) => n.toLowerCase()).join(",");
  for (const [sig, name] of DNS_SIGNATURES) {
    if (joined.includes(sig)) return name;
  }
  return nameservers.length > 0 ? "Custom DNS" : "Unknown";
}
