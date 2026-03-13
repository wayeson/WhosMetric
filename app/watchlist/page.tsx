/**
 * /watchlist — Domain Watchlist
 *
 * Reads the signed cookie server-side and renders watched domain statuses.
 * Each domain gets a live RDAP availability check rendered in parallel.
 */
import { cookies }    from "next/headers";
import type { Metadata } from "next";
import Link           from "next/link";
import { lookupDomain } from "@/lib/rdap";
import type { RDAPResult } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://whosmetric.com";

export const metadata: Metadata = {
  title: "My Watchlist — Tracked Domains",
  description: "Track domain availability changes with your WhosMetric watchlist.",
  robots: { index: false, follow: false }, // personal page
};

// ── Read & verify watchlist cookie ────────────────────────────────────────

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.WATCHLIST_SECRET || "whosmetric-watchlist-dev-secret-change-me";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function getWatchlist(token: string): Promise<string[]> {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return [];
    const key    = await getKey();
    const sigBuf = Buffer.from(sigB64, "base64url");
    const valid  = await crypto.subtle.verify("HMAC", key, sigBuf, new TextEncoder().encode(payloadB64));
    if (!valid) return [];
    return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8")) as string[];
  } catch {
    return [];
  }
}

// ── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ rdap }: { rdap: RDAPResult }) {
  if (rdap.available === true) {
    return (
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 9px", borderRadius: 5,
        background: "rgba(0,230,118,0.12)", color: "var(--green)", border: "1px solid rgba(0,230,118,0.35)",
      }}>
        ✓ AVAILABLE
      </span>
    );
  }
  if (rdap.available === false) {
    return (
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 9px", borderRadius: 5,
        background: "rgba(255,61,90,0.09)", color: "var(--red)", border: "1px solid rgba(255,61,90,0.25)",
      }}>
        ✗ REGISTERED
      </span>
    );
  }
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 9px", borderRadius: 5,
      background: "var(--card2)", color: "var(--dim)", border: "1px solid var(--border2)",
    }}>
      — UNKNOWN
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function WatchlistPage() {
  const jar     = await cookies();
  const token   = jar.get("pk_watchlist")?.value ?? "";
  const domains = await getWatchlist(token);

  // Parallel RDAP checks for all watched domains
  let results: Array<{ domain: string; rdap: RDAPResult }> = [];
  if (domains.length > 0) {
    const settled = await Promise.allSettled(
      domains.map(d => lookupDomain(d).then(rdap => ({ domain: d, rdap })))
    );
    results = settled
      .filter(r => r.status === "fulfilled")
      .map(r => (r as PromiseFulfilledResult<{ domain: string; rdap: RDAPResult }>).value);
  }

  const available = results.filter(r => r.rdap.available === true).length;

  return (
    <div className="pk-container">
      {/* Header */}
      <header style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)",
          letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10,
        }}>
          ★ WATCHLIST
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: "clamp(26px, 4vw, 40px)", color: "#fff",
          letterSpacing: "-0.03em", marginBottom: 10,
        }}>
          Your Tracked Domains
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--dim)" }}>
          Live RDAP status for every domain you&apos;re watching.
          {available > 0 && (
            <strong style={{ color: "var(--green)", marginLeft: 8 }}>
              {available} domain{available !== 1 ? "s" : ""} available now!
            </strong>
          )}
        </p>
      </header>

      {/* Stats */}
      {domains.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24,
        }}>
          {([
            ["📋", "Watching",  String(domains.length),  "domains tracked"],
            ["✓",  "Available", String(available),        "ready to register"],
            ["🔄", "Refreshed", "Just now",               "live RDAP"],
          ] as [string, string, string, string][]).map(([icon, label, val, sub]) => (
            <div key={label} style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "14px 16px", position: "relative", overflow: "hidden",
            }}>
              <div aria-hidden="true" style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: label === "Available" && available > 0 ? "var(--green)" : "var(--brand)",
              }} />
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {icon} {label}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--text)", marginTop: 6 }}>
                {val}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 3 }}>
                {sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {domains.length === 0 && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12,
          padding: "60px 40px", textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>☆</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--text)", marginBottom: 10 }}>
            Your watchlist is empty
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--dim)", maxWidth: 380, margin: "0 auto 24px" }}>
            Look up any domain and click <strong style={{ color: "var(--text)" }}>☆ Watch</strong> to start tracking availability.
          </p>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
            background: "linear-gradient(135deg, var(--brand), var(--brand-lt))",
            color: "#fff", padding: "10px 20px", borderRadius: 9,
            textDecoration: "none",
          }}>
            Search domains →
          </Link>
        </div>
      )}

      {/* Domain list */}
      {results.length > 0 && (
        <section aria-label={`${results.length} watched domains`} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {results.map(({ domain, rdap }) => (
            <article key={domain} style={{
              background: rdap.available === true ? "rgba(0,230,118,0.04)" : "var(--card)",
              border: `1px solid ${rdap.available === true ? "rgba(0,230,118,0.3)" : "var(--border)"}`,
              borderRadius: 12, padding: "16px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
            }}>
              <div>
                <Link
                  href={`/${domain}`}
                  style={{
                    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18,
                    color: rdap.available === true ? "var(--green)" : "#fff",
                    textDecoration: "none", letterSpacing: "-0.02em",
                  }}
                >
                  {domain}
                </Link>
                {rdap.found && rdap.available === false && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)", marginTop: 4 }}>
                    {rdap.registrar && `via ${rdap.registrar}`}
                    {rdap.expiry && ` · expires ${new Date(rdap.expiry).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StatusBadge rdap={rdap} />
                <Link
                  href={`/${domain}`}
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)",
                    background: "var(--card2)", border: "1px solid var(--border2)",
                    padding: "6px 12px", borderRadius: 6, textDecoration: "none",
                  }}
                >
                  Details →
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Disclaimer */}
      <aside style={{
        marginTop: 28, padding: 14, background: "var(--surface)",
        border: "1px solid var(--border)", borderRadius: 8, textAlign: "center",
      }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
          Watchlist stored locally in your browser. Data is not shared. Open this page from any browser session to check your tracked domains.
        </p>
      </aside>
    </div>
  );
}
