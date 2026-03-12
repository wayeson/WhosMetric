import "./globals.css";
import type { Metadata } from "next";
import { Syne, DM_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { LogoMark } from "@/components/Logo";
import TLDTicker from "@/components/TLDTicker";
import { getTLDTrends } from "@/lib/claude";

// FIX I16: next/font replaces render-blocking @import
const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-syne",
  display: "swap",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://packetally.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "Packetally — Domain Intelligence Platform",
    template: "%s | Packetally",
  },
  description:
    "Discover who owns any domain, check availability, explore domain portfolios, and find expiring domains. Free domain intelligence platform.",
  keywords: ["domain lookup", "whois", "rdap", "domain ownership", "domain intelligence", "expiring domains"],
  openGraph: {
    type: "website",
    siteName: "Packetally",
    locale: "en_US",
    url: BASE,
  },
  twitter: { card: "summary_large_image", site: "@packetally" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  robots: { index: true, follow: true },
};

// Fetch TLD trend data at the layout level so the ticker gets live data
// revalidates every 24h — stored in shared cache
export const revalidate = 86400;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Non-critical: ticker falls back to seed data if this fails
  const tldData = await getTLDTrends().catch(() => null);

  return (
    <html lang="en" className={`${syne.variable} ${dmMono.variable} ${jakarta.variable}`}>
      <body>
        {/* Skip to main content */}
        <a
          href="#main-content"
          className="sr-only"
          style={{
            position: "absolute", top: 8, left: 8,
            background: "var(--brand)", color: "#fff",
            padding: "8px 16px", borderRadius: 6,
            zIndex: 9999,
          }}
        >
          Skip to main content
        </a>

        {/* Sticky header */}
        <header
          role="banner"
          style={{
            background: "rgba(7,9,26,0.96)",
            borderBottom: "1px solid var(--border)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
            height: 56,
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              width: "100%",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: 20,
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              aria-label="Packetally — Home"
              style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}
            >
              <LogoMark size={28} aria-hidden="true" />
              <div style={{ lineHeight: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: 17,
                    color: "#fff",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Packet<span style={{ color: "var(--cyan)" }}>ally</span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 8,
                    color: "var(--muted)",
                    letterSpacing: "0.12em",
                    marginTop: 2,
                  }}
                >
                  DOMAIN INTELLIGENCE
                </div>
              </div>
            </Link>

            {/* Nav */}
            <nav aria-label="Main navigation" style={{ display: "flex", gap: 4 }}>
              <Link href="/" className="pk-nav-link">Home</Link>
              <Link href="/dropping-today" className="pk-nav-link">Dropping Today</Link>
            </nav>

            {/* Mini search — hidden on mobile */}
            <div
              style={{ flex: 1, maxWidth: 310 }}
              className="hide-mobile"
              aria-label="Quick domain search"
            >
              <SearchBar compact placeholder="Quick search…" />
            </div>
          </div>
        </header>

        {/* TLD Ticker — live crypto-style scrolling bar */}
        <TLDTicker data={tldData} />

        <main id="main-content" style={{ minHeight: "calc(100vh - 116px)" }}>
          {children}
        </main>

        {/* Footer */}
        <footer
          role="contentinfo"
          style={{ borderTop: "1px solid var(--border)", padding: "20px 22px", marginTop: 60 }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LogoMark size={18} aria-hidden="true" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)" }}>
                © 2026 Packetally · Domain Intelligence Platform
              </span>
            </div>
            <nav aria-label="Footer navigation" style={{ display: "flex", gap: 20 }}>
              {([["Home", "/"], ["Dropping Today", "/dropping-today"]] as const).map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>
              RDAP · Claude AI · Affiliate-Ready
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
