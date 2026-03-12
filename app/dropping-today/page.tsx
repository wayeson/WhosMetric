import type { Metadata } from "next";
import Link from "next/link";
import { getDroppingDomains } from "@/lib/claude";
import { getAffiliateLinks } from "@/lib/affiliates";
import type { DroppingDomain } from "@/lib/types";
import AffiliateButtons from "@/components/AffiliateButtons";
import SearchBar from "@/components/SearchBar";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://packetally.com";

export const metadata: Metadata = {
  title: "Dropping Today — Expiring Domains",
  description: "Browse expiring and dropping domains today. Find undervalued domain opportunities before they're gone.",
  alternates: { canonical: `${BASE}/dropping-today` },
  openGraph: {
    title: "Dropping Today — Expiring Domains | Packetally",
    description: "Find valuable expiring domains before they drop.",
    url: `${BASE}/dropping-today`,
  },
};

export const revalidate = 3600; // ISR: rebuild every hour

const VALUE_COLOR = (v: number) => {
  if (v >= 10000) return "var(--gold)";
  if (v >= 3000)  return "var(--cyan)";
  if (v >= 1000)  return "var(--green)";
  return "var(--text)";
};

const CAT_COLORS: Record<string, string> = {
  Tech: "var(--cyan)", Finance: "var(--gold)", AI: "var(--purple)",
  Gaming: "var(--green)", Health: "var(--green)", Media: "var(--orange)",
};

export default async function DroppingToday() {
  let domains: DroppingDomain[] | null = null;

  try {
    domains = await getDroppingDomains();
  } catch (err) {
    console.error("[dropping-today] failed:", err);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Dropping Today — Expiring Domains",
    description: "Browse expiring and dropping domains today",
    url: `${BASE}/dropping-today`,
  };

  const avgValue = domains?.length
    ? Math.round(domains.reduce((a, b) => a + (b.estimatedValue || 0), 0) / domains.length)
    : 0;

  return (
    <div className="pk-container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
          ⏳ EXPIRING NOW
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px, 4vw, 46px)", color: "#fff", letterSpacing: "-0.03em", marginBottom: 12 }}>
          Dropping Today
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--dim)", maxWidth: 440, margin: "0 auto 24px" }}>
          Domains expiring or dropping today. Grab them before someone else does.
        </p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SearchBar placeholder="Or search any domain…" />
        </div>
      </header>

      {/* Stats */}
      <div className="pk-stats-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }} role="list" aria-label="Overview statistics">
        {([
          ["⏳", "Expiring", `${domains?.length ?? 0}`, "domains listed"],
          ["💰", "Avg Value", avgValue > 0 ? `$${avgValue.toLocaleString()}` : "—", "estimated"],
          ["📡", "Source",   "Claude AI", "web-enriched"],
          ["🔄", "Updates",  "Hourly",    "fresh data"],
        ] as [string, string, string, string][]).map(([icon, label, val, sub]) => (
          <div key={label} role="listitem" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--brand)" }} aria-hidden="true" />
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{icon} {label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--text)", marginTop: 6 }}>{val}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Domain list */}
      {!domains ? (
        // FIX I23: User-friendly error message
        <div className="pk-card" style={{ padding: 48, textAlign: "center" }} role="alert">
          <div style={{ fontSize: 36, marginBottom: 16 }}>📡</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--text)", marginBottom: 10 }}>
            Could not load dropping domains
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--dim)", maxWidth: 380, margin: "0 auto" }}>
            We couldn't retrieve domain drop data right now. This is usually a temporary issue — please refresh the page or check back in a few minutes.
          </p>
        </div>
      ) : domains.length === 0 ? (
        <div className="pk-card" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--dim)" }}>No dropping domains found for today. Check back soon.</p>
        </div>
      ) : (
        <section aria-label={`${domains.length} dropping domains`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {domains.map((d, i) => (
              <DomainCard key={`${d.domain}-${i}`} domain={d} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <aside style={{ marginTop: 32, padding: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
          Data is AI-aggregated from public domain drop lists and market sources. Values are estimates only. Always verify availability before purchasing.
        </p>
      </aside>
    </div>
  );
}

function DomainCard({ domain: d, index }: { domain: DroppingDomain; index: number }) {
  const affiliates = getAffiliateLinks(d.domain);
  const catColor   = CAT_COLORS[d.category] ?? "var(--accent)";

  return (
    <article
      className="pk-card pk-card-hover pk-in"
      style={{ padding: "18px 22px", animationDelay: `${index * 0.04}s` }}
      aria-label={`${d.domain} — dropping domain`}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <Link
              href={`/${d.domain}`}
              style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, color: "#fff", letterSpacing: "-0.02em" }}
              aria-label={`View details for ${d.domain}`}
            >
              {d.domain}
            </Link>
            <span className="pk-chip" style={{ background: "rgba(255,75,110,0.1)", color: "var(--red)", borderColor: "rgba(255,75,110,0.3)" }}>⏳ Dropping</span>
            {d.category && (
              <span className="pk-chip" style={{ background: `${catColor}15`, color: catColor }}>{d.category}</span>
            )}
          </div>

          <dl style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {([
              ["Age",       d.age,                          "var(--text)"],
              ["TLD",       d.tld,                          "var(--cyan)"],
              ["Expires",   d.expiry,                       "var(--gold)"],
              ["Registrar", d.registrar,                    "var(--text)"],
              ["Backlinks", d.backlinks?.toLocaleString(),  "var(--purple)"],
            ] as [string, string | undefined, string][]).filter(([, v]) => v).map(([k, v, c]) => (
              <div key={k}>
                <dt style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.08em" }}>{k}</dt>
                <dd style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: c }}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right: value + CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, flexWrap: "wrap" }}>
          {d.estimatedValue > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", marginBottom: 4 }}>EST. VALUE</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: VALUE_COLOR(d.estimatedValue) }}>
                ${d.estimatedValue.toLocaleString()}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href={`/${d.domain}`} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", background: "var(--card2)", border: "1px solid var(--border2)", padding: "7px 14px", borderRadius: 7, textAlign: "center" }}>
              View Details →
            </Link>
            <AffiliateButtons links={affiliates} variant="compact" />
          </div>
        </div>
      </div>
    </article>
  );
}
