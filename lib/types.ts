// ─── Domain / RDAP ────────────────────────────────────────────────────────────

export type RDAPResult = RDAPFound | RDAPAvailable | RDAPError;

export interface RDAPFound {
  found: true;
  available: false;
  domain: string;
  registrar: string;
  registrantOrg: string | null;
  registered: string | null;
  expiry: string | null;
  updated: string | null;
  status: string[];
  nameservers: string[];
  handle: string | null;
  port43: string | null;
}

export interface RDAPAvailable {
  found: false;
  available: true;
  domain: string;
}

export interface RDAPError {
  found: false;
  available: null;
  domain: string;
  error: string;
}

export interface TLDResult {
  tld: string;
  domain: string;
  available: boolean | null;
}

// ─── AI Intelligence ──────────────────────────────────────────────────────────

export interface DomainSuggestion {
  domain: string;
  reason: string;
}

export interface ComparableSale {
  domain: string;
  price: number;
  year: string;
}

export interface DomainIntelligence {
  estimatedValue: number;
  brandScore: number;
  length: number;
  pronunciation: number;
  memorability: number;
  marketFit: number;
  category: string;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  comparables: ComparableSale[];
  suggestions: DomainSuggestion[];
}

export interface BrandIntelligence {
  companyName: string;
  industry: string;
  description: string;
  primaryDomain: string;
  knownDomains: Array<{
    domain: string;
    likely: boolean;
    note: string;
  }>;
  suggestedKeywords: string[];
  similarBrands: string[];
}

export interface DroppingDomain {
  domain: string;
  tld: string;
  age: string;
  expiry: string;
  estimatedValue: number;
  category: string;
  registrar: string;
  backlinks: number;
  previousOwner?: string;
}

// ─── New v3 Section Types ─────────────────────────────────────────────────────

export interface RecentlyDroppedDomain {
  domain: string;
  tld: string;
  length: number;
  dropTime: string;
  estimatedValue: number;
  category: string;
  backlinks: number;
}

export interface DomainSaleRecord {
  domain: string;
  price: number;
  saleDate: string;
  marketplace: string;
  category: string;
  notes: string;
}

export interface DomainNewsItem {
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
  category: string;
}

export interface TLDTrendItem {
  tld: string;
  registrations: number;
  change30d: number;
  avgPrice: number;
  trend: "up" | "down" | "stable";
  category: string;
  notes: string;
}

// ─── Affiliate ────────────────────────────────────────────────────────────────

export interface Affiliate {
  name: string;
  urlTemplate: string;
}

export interface AffiliateLink {
  name: string;
  url: string;
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

export type SlugType = "domain" | "brand";

export interface SlugMeta {
  slug: string;
  type: SlugType;
  canonicalBase: string;
}
