import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { LogoMark } from "@/components/Logo";
import RecentDropped from "@/app/sections/RecentDropped";
import RecentSales from "@/app/sections/RecentSales";
import DomainNews from "@/app/sections/DomainNews";
import TrendingTLDs from "@/app/sections/TrendingTLDs";
import { ErrorState } from "@/components/ui/Card";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://packetally.com";

export const metadata: Metadata = {
  title: "Packetally — Domain Intelligence Platform",
  description:
    "Discover who owns any domain, check availability, explore domain portfolios, and find expiring domains. Free, instant domain intelligence.",
  alternates: { canonical: BASE },
};

const POPULAR = [
  "openai.com", "stripe.com", "vercel.com", "linear.app",
  "notion.so", "figma.com", "supabase.com", "relay.io", "signal.ai",
];

const FEATURES: Array<{ icon: string; title: string; desc: string; href: string }> = [
  { icon: "🔍", title: "Domain Lookup",    href: "/stripe.com",      desc: "WHOIS, registrar, DNS provider, and registration dates — all in one place." },
  { icon: "⚡", title: "AI Brand Score",   href: "/signal.ai",       desc: "Claude-powered brand analysis, value estimate, and comparable sales." },
  { icon: "🌐", title: "TLD Availability", href: "/relay.io",        desc: "Check your keyword across 12 TLDs simultaneously via live RDAP." },
  { icon: "🏢", title: "Brand Portfolio",  href: "/vercel",          desc: "Search a company name to discover their full domain portfolio." },
  { icon: "⏳", title: "Dropping Today",   href: "/dropping-today",  desc: "Monitor expiring domains before they hit the open market." },
  { icon: "💰", title: "Affiliate-Ready",  href: "/relay.ai",        desc: "Every available domain shows instant register links to top registrars." },
];

// ─── Section loading fallbacks ─────────────────────────────────────────────

function SectionSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
      }}
      aria-busy="true"
      aria-label="Loading data…"
    >
      {/* header row */}
      <div
        style={{
          padding: "14px 18px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          className="pk-skeleton"
          style={{ width: 160, height: 13, borderRadius: 4 }}
        />
        <div
          className="pk-skeleton"
          style={{ width: 48, height: 20, borderRadius: 5 }}
        />
      </div>
      {/* body rows */}
      <div style={{ padding: "12px 18px 16px" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "9px 0",
              borderBottom: i < rows - 1 ? "1px solid var(--border)" : "none",
              gap: 12,
            }}
          >
            <div
              className="pk-skeleton"
              style={{ width: `${40 + (i % 3) * 15}%`, height: 12, borderRadius: 3 }}
            />
            <div
              className="pk-skeleton"
              style={{ width: 80, height: 12, borderRadius: 3, flexShrink: 0 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        aria-label="Search hero"
        style={{
          minHeight: "calc(100vh - 90px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 22px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glows */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: "40%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700, height: 500, borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(24,0,224,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: "18%", right: "8%",
            width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,212,255,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ textAlign: "center", maxWidth: 720, position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div
            aria-hidden="true"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(24,0,224,0.14)", border: "1px solid rgba(24,0,224,0.45)",
              borderRadius: 20, padding: "5px 14px", marginBottom: 28,
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)",
              letterSpacing: "0.06em",
            }}
          >
            <LogoMark size={14} aria-hidden />
            DOMAIN INTELLIGENCE PLATFORM
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)", fontWeight: 900, lineHeight: 1.06,
              fontSize: "clamp(36px, 6vw, 66px)", letterSpacing: "-0.04em",
              color: "#fff", marginBottom: 18,
            }}
          >
            Who owns that<br />
            <span style={{ color: "var(--cyan)" }}>domain?</span>
          </h1>

          <p
            style={{
              fontFamily: "var(--font-body)", fontSize: "clamp(15px, 2vw, 17px)",
              color: "var(--dim)", lineHeight: 1.7, marginBottom: 36,
              maxWidth: 480, margin: "0 auto 36px",
            }}
          >
            Instant RDAP lookup, AI brandability scoring, TLD availability,
            domain sales, and news — no account needed.
          </p>

          {/* Search */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <SearchBar placeholder="Search a domain or brand name…" />
          </div>

          {/* Popular domains */}
          <nav
            aria-label="Popular domain examples"
            style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}
          >
            <span
              aria-hidden="true"
              style={{
                fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)",
                letterSpacing: "0.08em", paddingTop: 5,
              }}
            >
              TRY:
            </span>
            {POPULAR.map(d => (
              <Link
                key={d}
                href={`/${d}`}
                aria-label={`Look up ${d}`}
                style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 11px",
                  background: "var(--card)", color: "var(--dim)",
                  border: "1px solid var(--border)", borderRadius: 5,
                  transition: "color 0.2s, border-color 0.2s",
                }}
              >
                {d}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* ── Live Data Sections ────────────────────────────────────────────── */}
      <section
        aria-label="Live domain market data"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "0 22px 20px" }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)",
            letterSpacing: "0.14em", textTransform: "uppercase",
            marginBottom: 20, textAlign: "center",
          }}
        >
          LIVE MARKET DATA
        </div>

        {/* Recently Dropped */}
        <Suspense fallback={<SectionSkeleton rows={10} />}>
          <RecentDropped />
        </Suspense>

        {/* Recent Sales */}
        <Suspense fallback={<SectionSkeleton rows={8} />}>
          <RecentSales />
        </Suspense>

        {/* News + TLD Trends side-by-side */}
        <div className="pk-grid-2" style={{ gap: 16, marginBottom: 16 }}>
          <Suspense fallback={<SectionSkeleton rows={6} />}>
            <DomainNews />
          </Suspense>
          <Suspense fallback={<SectionSkeleton rows={6} />}>
            <TrendingTLDs />
          </Suspense>
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────────────── */}
      <section
        aria-label="Platform features"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "0 22px 80px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)",
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12,
            }}
          >
            WHAT PACKETALLY DOES
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: "clamp(22px, 3vw, 34px)", color: "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            Domain data, instantly
          </h2>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}
          role="list"
        >
          {FEATURES.map(f => (
            <Link
              key={f.title}
              href={f.href}
              className="pk-card pk-card-hover pk-in"
              role="listitem"
              aria-label={`${f.title}: ${f.desc}`}
              style={{ padding: 22, display: "block", textDecoration: "none" }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }} aria-hidden="true">{f.icon}</div>
              <h3
                style={{
                  fontFamily: "var(--font-display)", fontWeight: 700,
                  fontSize: 16, color: "var(--text)", marginBottom: 8,
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--dim)", lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section
        aria-label="Platform highlights"
        style={{
          borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
          background: "var(--surface)", padding: "26px 22px",
        }}
      >
        <div
          style={{
            maxWidth: 900, margin: "0 auto",
            display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20,
          }}
        >
          {([
            ["Free",            "No API key needed"],
            ["RDAP-Powered",    "Live registry data"],
            ["AI-Scored",       "Brandability analysis"],
            ["Affiliate-Ready", "Instant register links"],
          ] as [string, string][]).map(([title, sub]) => (
            <div key={title} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: 20, color: "var(--cyan)", marginBottom: 4,
                }}
              >
                {title}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)" }}>
                {sub}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
