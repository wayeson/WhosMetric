import type { SlugType } from "./types";

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/i;
const BRAND_RE  = /^[a-z0-9][a-z0-9\s-]{0,60}$/i;

/**
 * Classify a URL slug as a domain or brand name.
 * Returns null for invalid / potentially malicious inputs.
 */
export function classifySlug(raw: string): { type: SlugType; value: string } | null {
  if (!raw || raw.length > 100) return null;

  // Strip protocol if user pasted a URL
  const stripped = raw
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")         // strip path
    .trim()
    .toLowerCase();

  if (!stripped) return null;

  if (DOMAIN_RE.test(stripped)) return { type: "domain", value: stripped };
  if (BRAND_RE.test(stripped))  return { type: "brand",  value: stripped };

  return null;
}

/**
 * Sanitize a string for safe Claude prompt interpolation.
 * Strips anything that could manipulate the AI prompt structure.
 */
export function sanitizeForPrompt(input: string): string {
  return input
    .replace(/[^a-z0-9.\-\s]/gi, "")  // allow only safe chars
    .slice(0, 100)
    .trim();
}

/**
 * Extract SLD (second-level domain) from a full domain string.
 * e.g. "stripe.com" → "stripe", "api.stripe.com" → "stripe"
 */
export function extractSLD(domain: string): string {
  const parts = domain.split(".");
  if (parts.length < 2) return domain;
  return parts[parts.length - 2];
}

/**
 * Validate that a value is a plausible domain name.
 */
export function isDomainLike(value: string): boolean {
  return DOMAIN_RE.test(value.toLowerCase());
}
