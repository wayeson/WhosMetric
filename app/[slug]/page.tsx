import { Suspense }          from "react";
import type { Metadata }     from "next";
import Link                  from "next/link";
import { notFound }          from "next/navigation";

import { lookupDomain, checkTLDAvailability, fmtDate, domainAge, detectDNSProvider } from "@/lib/rdap";
import { getDomainIntelligence, getBrandIntelligence }                                from "@/lib/claude";
import { getAffiliateLinks }                                                          from "@/lib/affiliates";
import { classifySlug, extractSLD }                                                   from "@/lib/validate";
import type { RDAPResult, TLDResult, DomainIntelligence, BrandIntelligence }          from "@/lib/types";

import SearchBar        from "@/components/SearchBar";
import AffiliateButtons from "@/components/AffiliateButtons";
import CopyButton       from "@/components/CopyButton";
import { LogoMark }     from "@/components/Logo";
import { DomainPageSkeleton } from "@/components/Skeleton";
import { ScoreRing, ScoreBar } from "@/components/ui/ScoreRing";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://packetally.com";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const classified = classifySlug(decodeURIComponent(params.slug));
  if (!classified) return { title: "Not Found" };

  const { type, value } = classified;

  if (type === "domain") {
    return {
      title: `Who Owns ${value}?`,
      description: `Discover who owns ${value}, its registrar, registration dates, nameservers, and related domains. Free domain intelligence by Packetally.`,
      openGraph: {
        title: `Who Owns ${value}? | Packetally`,
        description: `Domain intelligence for ${value}`,
        url: `${BASE}/${value}`,
      },
      alternates: { canonical: `${BASE}/${value}` },
    };
  }

  return {
    title: `${value} Domain Portfolio`,
    description: `Explore domain portfolio and intelligence for ${value}. Find owned and available domain variations.`,
    openGraph: {
      title: `${value} Domain Portfolio | Packetally`,
      url: `${BASE}/${value}`,
    },
    alternates: { canonical: `${BASE}/${value}` },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SlugPage({ params }: { params: { slug: string } }) {
  const classified = classifySlug(decodeURIComponent(params.slug));
  if (!classified) notFound();

  const { type, value } = classified;

  if (type === "domain") {
    return (
      // FIX I6: Suspense boundary — shows skeleton while server fetches
      <Suspense fallback={<DomainPageSkeleton />}>
        <DomainPageServer domain={value} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<DomainPageSkeleton />}>
      <BrandPageServer brand={value} />
    </Suspense>
  );
}

// ─── Domain Page ──────────────────────────────────────────────────────────────
// FIX I2: Correct fetch order — RDAP first, then intelligence (single call)
// FIX I12: try/catch around all fetches, graceful error UI

async function DomainPageServer({ domain }: { domain: string }) {
  const sld = extractSLD(domain);

  let rdap: RDAPResult;
  let tldData: TLDResult[];
  let intel: DomainIntelligence | null;

  try {
    // Step 1: RDAP + TLD in parallel (no Claude yet)
    [rdap, tldData] = await Promise.all([
      lookupDomain(domain),
      checkTLDAvailability(sld),
    ]);

    // Step 2: Intelligence with rdap context (SINGLE call - FIX I2)
    intel = await getDomainIntelligence(domain, rdap).catch(() => null);
  } catch (err) {
    console.error("[DomainPage] fetch error:", err);
    return <FetchError domain={domain} />;
  }

  const affiliates  = getAffiliateLinks(domain);
  const dnsProvider = detectDNSProvider(("nameservers" in rdap ? rdap.nameservers : undefined) ?? []);
  const age         = "registered" in rdap ? domainAge(rdap.registered) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Who Owns ${domain}?`,
    description: `Domain intelligence for ${domain}`,
    url: `${BASE}/${domain}`,
    about: { "@type": "WebSite", name: domain, url: `https://${domain}` },
  };

  const isAvailable = rdap.available === true;
  const isRegistered = rdap.found === true;

  return (
    <div className="pk-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Search */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <SearchBar initialValue={domain} />
      </div>

      {/* Domain header card */}
      <div className="pk-card pk-in" style={{ marginBottom: 18, padding: 26 }} role="article" aria-label={`Domain report for ${domain}`}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: 11, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">
                <LogoMark size={28} aria-hidden />
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,30px)", color: "#fff", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
                  {domain}
                  <CopyButton value={domain} label="domain name" />
                </h1>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)", marginTop: 3 }}>
                  Domain Intelligence Report · Packetally
                </div>
              </div>
            </div>

            {/* Status chips */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 8 }}>
              <span
                className={`pk-chip ${isAvailable ? "status-available" : isRegistered ? "status-taken" : "status-unknown"}`}
                role="status"
                aria-live="polite"
              >
                {isAvailable ? "✓ Available" : isRegistered ? "✗ Registered" : "⚠ Unknown"}
              </span>
              {isRegistered && age && (
                <span className="pk-chip" style={{ background: "rgba(91,117,255,0.12)", color: "var(--accent)" }}>{age} old</span>
              )}
              {intel?.category && (
                <span className="pk-chip" style={{ background: "rgba(157,110,255,0.12)", color: "var(--purple)" }}>{intel.category}</span>
              )}
            </div>
          </div>

          {/* Score + Value */}
          {intel && (
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              {intel.brandScore && (
                <div style={{ textAlign: "center", background: "var(--card2)", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.1em" }}>BRAND SCORE</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 28, marginTop: 4,
                    color: intel.brandScore >= 75 ? "var(--green)" : intel.brandScore >= 55 ? "var(--cyan)" : intel.brandScore >= 35 ? "var(--gold)" : "var(--red)" }}>
                    {intel.brandScore}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)" }}>/100</div>
                </div>
              )}
              {intel.estimatedValue > 0 && (
                <div style={{ textAlign: "center", background: "var(--card2)", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.1em" }}>EST. VALUE</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: "var(--gold)", marginTop: 4 }}>
                    ${intel.estimatedValue.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)" }}>USD</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Verdict */}
        {intel?.verdict && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--dim)", lineHeight: 1.7, marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            {intel.verdict}
          </p>
        )}

        {/* Available CTA */}
        {isAvailable && (
          <div style={{ marginTop: 20, padding: 18, background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.22)", borderRadius: 10 }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--green)", marginBottom: 14 }}>
              ✓ Domain available — register it now
            </p>
            <AffiliateButtons links={affiliates} variant="full" />
          </div>
        )}
      </div>

      {/* Grid: Registration + TLD */}
      <div className="pk-grid-2" style={{ marginBottom: 18 }}>
        {/* Registration details */}
        {isRegistered && rdap.found && (
          <section className="pk-card pk-in" aria-label="Registration details">
            <div className="pk-sh">
              <div>
                <div className="pk-sh-title">📋 Ownership Details</div>
                <div className="pk-sh-sub">Source: RDAP Protocol · rdap.org</div>
              </div>
            </div>
            <div style={{ padding: "12px 20px 18px" }}>
              {([
                ["Registrar",   rdap.registrar,    rdap.registrar],
                ["Organization",rdap.registrantOrg,rdap.registrantOrg],
                ["Registered",  fmtDate(rdap.registered), rdap.registered],
                ["Expires",     fmtDate(rdap.expiry),     rdap.expiry],
                ["Updated",     fmtDate(rdap.updated),    rdap.updated],
                ["DNS Provider",dnsProvider,        null],
                ["Handle",      rdap.handle,        rdap.handle],
              ] as [string, string | null, string | null][]).filter(([, v]) => v).map(([k, display, copyVal]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)", flexShrink: 0, marginRight: 10 }}>{k}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)", textAlign: "right", wordBreak: "break-all" }}>{display}</span>
                    {copyVal && <CopyButton value={copyVal} label={k} />}
                  </div>
                </div>
              ))}

              {rdap.nameservers?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.08em", marginBottom: 7 }}>NAMESERVERS</div>
                  {rdap.nameservers.map((ns, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)", padding: "5px 8px", background: "var(--surface)", borderRadius: 5, marginBottom: 4 }}>
                      <span>{ns}</span>
                      <CopyButton value={ns} label={`nameserver ${ns}`} />
                    </div>
                  ))}
                </div>
              )}

              {rdap.status?.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {rdap.status.map((s, i) => (
                    <span key={i} className="pk-chip" style={{ background: "rgba(91,117,255,0.1)", color: "var(--accent)" }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* TLD Availability */}
        <section className="pk-card pk-in" aria-label={`TLD availability for "${sld}"`}>
          <div className="pk-sh">
            <div>
              <div className="pk-sh-title">🌐 TLD Availability</div>
              <div className="pk-sh-sub">Live RDAP · "{sld}" across 12 extensions</div>
            </div>
          </div>
          <div style={{ padding: "12px 16px 16px", display: "flex", flexWrap: "wrap", gap: 9 }}>
            {tldData.map((a) => (
              <div
                key={a.tld}
                style={{
                  padding: "7px 12px", borderRadius: 9, textAlign: "center", minWidth: 64,
                  background: a.available === true ? "rgba(0,230,118,0.08)" : "var(--card2)",
                  border: `1px solid ${a.available === true ? "rgba(0,230,118,0.4)" : "var(--border)"}`,
                }}
                aria-label={`${a.domain}: ${a.available === true ? "available" : a.available === false ? "taken" : "unknown"}`}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
                  color: a.available === true ? "var(--green)" : a.available === false ? "var(--muted)" : "var(--dim)" }}>
                  {a.tld}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, marginTop: 2, color: a.available === true ? "rgba(0,230,118,0.8)" : "var(--muted)" }}>
                  {a.available === true ? "✓ Free" : a.available === false ? "✗ Taken" : "—"}
                </div>
                {a.available === true && (
                  <div style={{ marginTop: 6 }}>
                    <AffiliateButtons links={getAffiliateLinks(a.domain)} variant="compact" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* AI Brand Intelligence */}
      {intel && (
        <section className="pk-card pk-in" style={{ marginBottom: 18 }} aria-label="AI brand intelligence">
          <div className="pk-sh">
            <div>
              <div className="pk-sh-title">⚡ AI Brandability Score</div>
              <div className="pk-sh-sub">Claude AI · Live market data · Real comparable sales</div>
            </div>
          </div>
          <div style={{ padding: "18px 22px" }}>
            <div style={{ display: "flex", gap: 18, marginBottom: 16, flexWrap: "wrap" }}>
              {/* Score ring */}
              <ScoreRing score={intel.brandScore} />
              <div style={{ flex: 1, minWidth: 200 }}>
                {([["Length", intel.length], ["Pronunciation", intel.pronunciation], ["Memorability", intel.memorability], ["Market Fit", intel.marketFit]] as [string, number][]).map(([label, val]) => (
                  <ScoreBar key={label} label={label} value={val} />
                ))}
              </div>
            </div>

            {/* Strengths / Weaknesses */}
            {(intel.strengths?.length > 0 || intel.weaknesses?.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {intel.strengths?.length > 0 && (
                  <div style={{ background: "rgba(0,230,118,0.07)", border: "1px solid rgba(0,230,118,0.2)", borderRadius: 8, padding: "10px 13px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--green)", marginBottom: 7, letterSpacing: "0.08em" }}>STRENGTHS</div>
                    {intel.strengths.map((s, i) => <div key={i} style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text)", marginBottom: 4 }}>✓ {s}</div>)}
                  </div>
                )}
                {intel.weaknesses?.length > 0 && (
                  <div style={{ background: "rgba(255,75,110,0.07)", border: "1px solid rgba(255,75,110,0.2)", borderRadius: 8, padding: "10px 13px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--red)", marginBottom: 7, letterSpacing: "0.08em" }}>WEAKNESSES</div>
                    {intel.weaknesses.map((w, i) => <div key={i} style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text)", marginBottom: 4 }}>✗ {w}</div>)}
                  </div>
                )}
              </div>
            )}

            {/* Comparable sales */}
            {intel.comparables?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  Comparable Sales
                </div>
                {intel.comparables.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "var(--surface)", borderRadius: 7, padding: "8px 14px", marginBottom: 5 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>{c.domain}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {c.year && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)" }}>{c.year}</span>}
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>${(c.price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {intel?.suggestions?.length > 0 && (
        <section className="pk-card pk-in" style={{ marginBottom: 18 }} aria-label="Similar domain suggestions">
          <div className="pk-sh">
            <div>
              <div className="pk-sh-title">💡 Similar Domains</div>
              <div className="pk-sh-sub">AI-powered alternatives · register available variations</div>
            </div>
          </div>
          <div style={{ padding: "12px 16px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {intel.suggestions.map((s, i) => (
              <article key={i} style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <Link href={`/${s.domain}`} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                    {s.domain}
                  </Link>
                  <span className="pk-chip" style={{ background: "rgba(0,207,255,0.1)", color: "var(--cyan)", fontSize: 9 }}>Alt</span>
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--dim)", marginBottom: 10 }}>{s.reason}</p>
                <AffiliateButtons links={getAffiliateLinks(s.domain)} variant="compact" />
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Taken domain CTA */}
      {isRegistered && (
        <div className="pk-card pk-in" style={{ padding: 22 }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 14 }}>
            🔎 Find an alternative to {domain}
          </p>
          <AffiliateButtons links={getAffiliateLinks(sld)} variant="full" />
        </div>
      )}
    </div>
  );
}

// ─── Brand Page ───────────────────────────────────────────────────────────────

async function BrandPageServer({ brand }: { brand: string }) {
  let brandIntel: BrandIntelligence | null = null;
  let tldData: TLDResult[];

  try {
    [brandIntel, tldData] = await Promise.all([
      getBrandIntelligence(brand).catch(() => null),
      checkTLDAvailability(brand),
    ]);
  } catch (err) {
    console.error("[BrandPage] fetch error:", err);
    return <FetchError domain={brand} />;
  }

  const primaryDomain = brandIntel?.primaryDomain ?? `${brand}.com`;
  const rdap = await lookupDomain(primaryDomain).catch(() => null);
  const affiliates = getAffiliateLinks(primaryDomain);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${brand} Domain Portfolio`,
    description: `Domain portfolio and intelligence for ${brand}`,
    url: `${BASE}/${brand}`,
  };

  const availableTLDs = tldData.filter((a) => a.available === true);

  return (
    <div className="pk-container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <SearchBar initialValue={brand} />
      </div>

      {/* Brand header */}
      <div className="pk-card pk-in" style={{ marginBottom: 18, padding: 26 }} role="article">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: "#fff" }}>
              {brand[0].toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3vw,32px)", color: "#fff", letterSpacing: "-0.02em", textTransform: "capitalize" }}>
              {brandIntel?.companyName ?? brand}
            </h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {brandIntel?.industry && <span className="pk-chip" style={{ background: "rgba(91,117,255,0.12)", color: "var(--accent)" }}>{brandIntel.industry}</span>}
              <span className="pk-chip" style={{ background: "rgba(0,207,255,0.1)", color: "var(--cyan)" }}>Brand Portfolio</span>
            </div>
            {brandIntel?.description && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--dim)", lineHeight: 1.65, marginTop: 12 }}>
                {brandIntel.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pk-grid-2" style={{ marginBottom: 18 }}>
        {/* Primary domain */}
        {rdap?.found && (
          <section className="pk-card pk-in" aria-label={`Registration details for ${primaryDomain}`}>
            <div className="pk-sh">
              <div className="pk-sh-title">🏠 Primary Domain: {primaryDomain}</div>
            </div>
            <div style={{ padding: "12px 20px 18px" }}>
              {([
                ["Registrar",   rdap.registrar],
                ["Registered",  fmtDate(rdap.registered)],
                ["Expires",     fmtDate(rdap.expiry)],
                ["DNS Provider",detectDNSProvider(rdap.nameservers ?? [])],
              ] as [string, string | null][]).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)" }}>{k}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)" }}>{v}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TLD availability */}
        <section className="pk-card pk-in" aria-label={`TLD availability for "${brand}"`}>
          <div className="pk-sh">
            <div className="pk-sh-title">🌐 "{brand}" TLD Check</div>
            <div className="pk-sh-sub">Available extensions</div>
          </div>
          <div style={{ padding: "12px 16px 16px", display: "flex", flexWrap: "wrap", gap: 9 }}>
            {tldData.map((a) => (
              <div key={a.tld} style={{
                padding: "7px 12px", borderRadius: 8, textAlign: "center", minWidth: 62,
                background: a.available === true ? "rgba(0,230,118,0.08)" : "var(--card2)",
                border: `1px solid ${a.available === true ? "rgba(0,230,118,0.35)" : "var(--border)"}`,
              }}
                aria-label={`${a.domain}: ${a.available === true ? "available" : a.available === false ? "taken" : "unknown"}`}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: a.available === true ? "var(--green)" : "var(--muted)" }}>{a.tld}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, marginTop: 2, color: a.available === true ? "rgba(0,230,118,0.8)" : "var(--muted)" }}>
                  {a.available === true ? "✓ Free" : a.available === false ? "✗ Taken" : "—"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Known domains */}
      {brandIntel?.knownDomains?.length > 0 && (
        <section className="pk-card pk-in" style={{ marginBottom: 18 }} aria-label="Known domain portfolio">
          <div className="pk-sh">
            <div className="pk-sh-title">🏢 Known Domain Portfolio</div>
            <div className="pk-sh-sub">AI-detected domains associated with {brandIntel.companyName ?? brand}</div>
          </div>
          <table className="pk-table">
            <thead>
              <tr>
                <th scope="col">Domain</th>
                <th scope="col">Note</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {brandIntel.knownDomains.map((item, i) => (
                <tr key={i}>
                  <td><Link href={`/${item.domain}`} style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--cyan)" }}>{item.domain}</Link></td>
                  <td style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--dim)" }}>{item.note ?? "—"}</td>
                  <td><span className={`pk-chip ${item.likely ? "status-taken" : "status-unknown"}`}>{item.likely ? "Likely Owned" : "Check"}</span></td>
                  <td><Link href={`/${item.domain}`} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)" }}>Details →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Available TLD register CTA */}
      {availableTLDs.length > 0 && (
        <section className="pk-card pk-in" style={{ padding: 22 }} aria-label="Register available domains">
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 16 }}>
            💰 Register Available Variations
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {availableTLDs.map((a) => (
              <article key={a.tld} style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.2)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--green)", marginBottom: 10 }}>{a.domain}</div>
                <AffiliateButtons links={getAffiliateLinks(a.domain)} variant="compact" />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Error UI ──────────────────────────────────────────────────────────────── 
// FIX I23: User-friendly error messages

function FetchError({ domain }: { domain: string }) {
  return (
    <div className="pk-container">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <SearchBar initialValue={domain} />
      </div>
      <div className="pk-card" style={{ padding: 48, textAlign: "center" }} role="alert">
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--text)", marginBottom: 10 }}>
          Couldn't load domain data
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--dim)", marginBottom: 20 }}>
          We had trouble fetching information for <strong style={{ color: "var(--text)" }}>{domain}</strong>.
          This could be a temporary network issue — please try again in a moment.
        </p>
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--cyan)", background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", padding: "9px 18px", borderRadius: 8 }}>
          ← Back to search
        </Link>
      </div>
    </div>
  );
}

// ScoreRing and ScoreBar are imported from @/components/ui/ScoreRing
