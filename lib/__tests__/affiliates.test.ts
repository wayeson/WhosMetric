import { describe, it, expect, beforeEach } from "vitest";
import { resolveAffiliateUrl, getAffiliateLinks, resetAffiliateCache } from "../affiliates";

beforeEach(() => {
  resetAffiliateCache();
});

describe("resolveAffiliateUrl", () => {
  it("replaces {domain} with encoded domain", () => {
    const url = resolveAffiliateUrl("https://example.com/search?q={domain}", "stripe.com");
    expect(url).toBe("https://example.com/search?q=stripe.com");
  });

  it("URL-encodes special characters in domain", () => {
    const url = resolveAffiliateUrl("https://example.com/search?q={domain}", "test domain.com");
    expect(url).toContain("test%20domain.com");
  });

  it("replaces all occurrences of {domain}", () => {
    const url = resolveAffiliateUrl("{domain} and {domain}", "stripe.com");
    expect(url).toBe("stripe.com and stripe.com");
  });

  it("leaves template unchanged if {domain} not present", () => {
    const url = resolveAffiliateUrl("https://example.com/static", "stripe.com");
    expect(url).toBe("https://example.com/static");
  });
});

describe("getAffiliateLinks", () => {
  it("returns array of affiliate links", () => {
    const links = getAffiliateLinks("stripe.com");
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(0);
  });

  it("each link has name and url", () => {
    const links = getAffiliateLinks("stripe.com");
    for (const link of links) {
      expect(typeof link.name).toBe("string");
      expect(typeof link.url).toBe("string");
      expect(link.url.length).toBeGreaterThan(0);
    }
  });

  it("urls do not contain {domain} placeholder", () => {
    const links = getAffiliateLinks("stripe.com");
    for (const link of links) {
      expect(link.url).not.toContain("{domain}");
    }
  });

  it("encodes the domain in the url", () => {
    const links = getAffiliateLinks("my-brand.co");
    for (const link of links) {
      expect(link.url).toContain("my-brand.co");
    }
  });
});
