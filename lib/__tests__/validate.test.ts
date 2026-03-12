import { describe, it, expect } from "vitest";
import { classifySlug, sanitizeForPrompt, extractSLD, isDomainLike } from "../validate";

describe("classifySlug", () => {
  it("classifies a simple domain", () => {
    const result = classifySlug("stripe.com");
    expect(result?.type).toBe("domain");
    expect(result?.value).toBe("stripe.com");
  });

  it("classifies a subdomain-style domain", () => {
    const result = classifySlug("api.stripe.com");
    expect(result?.type).toBe("domain");
  });

  it("classifies a brand name", () => {
    const result = classifySlug("stripe");
    expect(result?.type).toBe("brand");
    expect(result?.value).toBe("stripe");
  });

  it("strips protocol prefix", () => {
    const result = classifySlug("https://stripe.com");
    expect(result?.type).toBe("domain");
    expect(result?.value).toBe("stripe.com");
  });

  it("returns null for empty string", () => {
    expect(classifySlug("")).toBeNull();
  });

  it("returns null for path traversal", () => {
    expect(classifySlug("../../etc/passwd")).toBeNull();
  });

  it("returns null for overly long input", () => {
    expect(classifySlug("a".repeat(101))).toBeNull();
  });

  it("returns null for script injection", () => {
    expect(classifySlug("<script>alert(1)</script>")).toBeNull();
  });

  it("returns null for SQL injection attempt", () => {
    expect(classifySlug("'; DROP TABLE domains; --")).toBeNull();
  });

  it("normalizes to lowercase", () => {
    const result = classifySlug("Stripe.COM");
    expect(result?.value).toBe("stripe.com");
  });
});

describe("sanitizeForPrompt", () => {
  it("allows safe domain characters", () => {
    expect(sanitizeForPrompt("stripe.com")).toBe("stripe.com");
  });

  it("strips angle brackets", () => {
    expect(sanitizeForPrompt("ignore this and <script>")).not.toContain("<");
  });

  it("strips quotes", () => {
    expect(sanitizeForPrompt(`say "hello" or 'goodbye'`)).not.toContain('"');
    expect(sanitizeForPrompt(`say "hello" or 'goodbye'`)).not.toContain("'");
  });

  it("truncates to 100 chars", () => {
    const result = sanitizeForPrompt("a".repeat(200));
    expect(result.length).toBeLessThanOrEqual(100);
  });
});

describe("extractSLD", () => {
  it("extracts SLD from a simple domain", () => {
    expect(extractSLD("stripe.com")).toBe("stripe");
  });

  it("extracts SLD from a subdomain", () => {
    expect(extractSLD("api.stripe.com")).toBe("stripe");
  });

  it("returns the input if no dots", () => {
    expect(extractSLD("stripe")).toBe("stripe");
  });
});

describe("isDomainLike", () => {
  it("returns true for valid domains", () => {
    expect(isDomainLike("stripe.com")).toBe(true);
    expect(isDomainLike("my-brand.io")).toBe(true);
    expect(isDomainLike("relay.ai")).toBe(true);
  });

  it("returns false for brand-only names", () => {
    expect(isDomainLike("stripe")).toBe(false);
  });

  it("returns false for malformed input", () => {
    expect(isDomainLike("<script>")).toBe(false);
  });
});
