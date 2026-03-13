"use client";
/**
 * /bulk — Bulk Domain Checker
 *
 * Paste up to 20 domains, check all of them simultaneously via RDAP.
 * No AI — pure availability checking for power users and domainers.
 * Results stream in progressively as each check completes.
 */
import { useState, useCallback } from "react";
import Link from "next/link";
import { classifySlug } from "@/lib/validate";

interface CheckResult {
  domain:    string;
  available: boolean | null;
  registrar?: string;
  expiry?:   string;
  error?:    string;
  loading:   boolean;
}

const MAX = 20;

async function checkOne(domain: string): Promise<CheckResult> {
  try {
    const res = await fetch(`/api/rdap?domain=${encodeURIComponent(domain)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rdap = data.rdap as {
      available: boolean | null;
      registrar?: string;
      expiry?:   string;
      error?:    string;
    };
    return {
      domain,
      available: rdap.available ?? null,
      registrar: rdap.registrar,
      expiry:    rdap.expiry ?? undefined,
      loading:   false,
    };
  } catch (e: unknown) {
    return { domain, available: null, error: (e as Error).message, loading: false };
  }
}

function parseDomains(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map(s => s.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/\/.*/, ""))
    .filter(Boolean)
    .filter(s => classifySlug(s)?.type === "domain")
    .slice(0, MAX);
}

export default function BulkPage() {
  const [input,   setInput]   = useState("");
  const [results, setResults] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [done,    setDone]    = useState(false);

  const run = useCallback(async () => {
    const domains = parseDomains(input);
    if (!domains.length) return;

    setDone(false);
    setRunning(true);
    // Seed loading rows immediately
    setResults(domains.map(d => ({ domain: d, available: null, loading: true })));

    // Run all in parallel — update each result as it resolves
    await Promise.allSettled(
      domains.map(async (d, i) => {
        const result = await checkOne(d);
        setResults(prev => {
          const next = [...prev];
          next[i] = result;
          return next;
        });
      })
    );

    setRunning(false);
    setDone(true);
  }, [input]);

  const parsed   = parseDomains(input);
  const available = results.filter(r => r.available === true).length;
  const taken     = results.filter(r => r.available === false).length;

  return (
    <div className="pk-container" style={{ maxWidth: 820 }}>
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
          ⚡ POWER TOOL
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(26px, 4vw, 42px)", color: "#fff", letterSpacing: "-0.03em", marginBottom: 10 }}>
          Bulk Domain Checker
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--dim)", maxWidth: 440, margin: "0 auto" }}>
          Check up to {MAX} domains at once via live RDAP. Paste one per line or comma-separated.
        </p>
      </header>

      {/* Input */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <label htmlFor="bulk-input" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
          Enter Domains ({parsed.length} / {MAX} valid)
        </label>
        <textarea
          id="bulk-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={"stripe.com\nvercel.com\nrelay.io\nopenai.com"}
          rows={6}
          spellCheck={false}
          style={{
            width: "100%", background: "var(--surface)", border: "1px solid var(--border2)",
            borderRadius: 8, padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13,
            color: "var(--text)", resize: "vertical", outline: "none",
            lineHeight: 1.7,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)" }}>
            {parsed.length} valid domain{parsed.length !== 1 ? "s" : ""} found
          </span>
          <button
            onClick={run}
            disabled={running || parsed.length === 0}
            style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
              background: running ? "var(--card2)" : "linear-gradient(135deg, var(--brand), var(--brand-lt))",
              color: running ? "var(--dim)" : "#fff",
              border: "none", padding: "10px 22px", borderRadius: 9,
              cursor: running || parsed.length === 0 ? "default" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {running ? "Checking…" : `Check ${parsed.length || "Domains"} →`}
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {([
            ["Total",    results.length,  "var(--text)"],
            ["✓ Free",   available,       "var(--green)"],
            ["✗ Taken",  taken,           "var(--red)"],
          ] as [string, number, string][]).map(([label, count, color]) => (
            <div key={label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 9, padding: "11px 14px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color }}>{count}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px 11px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
              Results
            </span>
            {done && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)" }}>
                ✓ Complete
              </span>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="pk-table" aria-label="Bulk domain check results">
              <thead>
                <tr>
                  {["Domain", "Status", "Registrar", "Expires", "Actions"].map(h => (
                    <th key={h} scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.domain} style={{ animationDelay: `${i * 0.03}s` }}>
                    <td>
                      <Link href={`/${r.domain}`} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                        {r.domain}
                      </Link>
                    </td>
                    <td>
                      {r.loading ? (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)" }}>
                          <span style={{ width: 12, height: 12, border: "2px solid var(--border2)", borderTopColor: "var(--cyan)", borderRadius: "50%", display: "inline-block", animation: "pk-spin .6s linear infinite" }} />
                          Checking…
                        </span>
                      ) : r.available === true ? (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 8px", borderRadius: 5, background: "rgba(0,230,118,0.12)", color: "var(--green)", border: "1px solid rgba(0,230,118,0.35)" }}>✓ Available</span>
                      ) : r.available === false ? (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 8px", borderRadius: 5, background: "rgba(255,61,90,0.09)", color: "var(--red)", border: "1px solid rgba(255,61,90,0.25)" }}>✗ Taken</span>
                      ) : (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>— Unknown</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)" }}>
                        {r.registrar ?? (r.loading ? "—" : "—")}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)" }}>
                        {r.expiry ? new Date(r.expiry).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </span>
                    </td>
                    <td>
                      <Link href={`/${r.domain}`} style={{
                        fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)",
                        background: "var(--card2)", border: "1px solid var(--border2)",
                        padding: "4px 10px", borderRadius: 5, textDecoration: "none",
                      }}>
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <aside style={{ marginTop: 24, padding: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
          Live RDAP lookups via rdap.org. Results are real-time but may vary by registrar response time.
        </p>
      </aside>
    </div>
  );
}
