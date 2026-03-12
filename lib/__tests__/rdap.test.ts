import { describe, it, expect, vi } from "vitest";
import { fmtDate, domainAge, detectDNSProvider } from "../rdap";

describe("fmtDate", () => {
  it("formats ISO string to human-readable date", () => {
    const result = fmtDate("2020-01-15T00:00:00Z");
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2020/);
  });
  it("returns null for null input", () => {
    expect(fmtDate(null)).toBeNull();
  });
  it("handles malformed date gracefully", () => {
    const result = fmtDate("not-a-date");
    expect(result).toBeDefined();
  });
});

describe("domainAge", () => {
  it("returns years for old domain", () => {
    const result = domainAge("2014-01-01T00:00:00Z");
    expect(result).toMatch(/yr/);
  });
  it("returns months for recent domain", () => {
    const recent = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
    const result = domainAge(recent);
    expect(result).toMatch(/mo/);
  });
  it("returns null for null input", () => {
    expect(domainAge(null)).toBeNull();
  });
});

describe("detectDNSProvider", () => {
  it("detects Cloudflare", () => {
    expect(detectDNSProvider(["ns1.cloudflare.com", "ns2.cloudflare.com"])).toBe("Cloudflare");
  });
  it("detects Amazon Route 53", () => {
    expect(detectDNSProvider(["ns-123.awsdns-45.com"])).toBe("Amazon Route 53");
  });
  it("detects Vercel", () => {
    expect(detectDNSProvider(["ns1.vercel-dns.com"])).toBe("Vercel");
  });
  it("detects Namecheap", () => {
    expect(detectDNSProvider(["dns1.registrar-servers.com"])).toBe("Namecheap");
  });
  it("returns Custom DNS for unknown nameservers", () => {
    expect(detectDNSProvider(["ns1.some-unknown-host.net"])).toBe("Custom DNS");
  });
  it("returns dash for empty array", () => {
    expect(detectDNSProvider([])).toBe("—");
  });
});
