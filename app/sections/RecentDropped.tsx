import Link                    from "next/link";
import { getRecentlyDropped } from "@/lib/claude";
import { Card, CardHeader, Chip, ErrorState, EmptyState } from "@/components/ui/Card";
import type { RecentlyDroppedDomain } from "@/lib/types";

export const revalidate = 3600; // ISR: rebuild every hour

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return iso; }
}

function valColor(v: number): string {
  if (v >= 10000) return "var(--gold)";
  if (v >= 3000)  return "var(--cyan)";
  if (v >= 1000)  return "var(--green)";
  return "var(--text)";
}

const CAT_COLOR: Record<string, string> = {
  Tech: "var(--cyan)", Finance: "var(--gold)", AI: "var(--purple)",
  Gaming: "var(--green)", Health: "var(--green)", Media: "var(--orange)",
};

export default async function RecentDropped() {
  let data: RecentlyDroppedDomain[] | null = null;
  let isError = false;

  try {
    data = await getRecentlyDropped();
  } catch {
    isError = true;
  }

  return (
    <Card accent="var(--red)" style={{ marginBottom: 16 }}>
      <CardHeader
        icon="🔥"
        title="Recently Dropped Domains"
        sub="Expired domains from the past 7 days · Real-time data"
        right={<Chip label="LIVE" color="var(--red)" size="xs" />}
      />

      {isError && (
        <ErrorState
          title="Could not load dropped domains"
          sub="Domain drop data may be temporarily unavailable. Try refreshing."
        />
      )}

      {!isError && (!data || data.length === 0) && (
        <EmptyState
          icon="📭"
          title="No recent drops found"
          sub="Check back soon — the list refreshes hourly."
        />
      )}

      {!isError && data && data.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse" }}
            aria-label="Recently dropped domains"
          >
            <thead>
              <tr>
                {["Domain", "TLD", "Length", "Dropped", "Backlinks", "Est. Value", ""].map(h => (
                  <th
                    key={h}
                    scope="col"
                    style={{
                      padding: "9px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      color: "var(--dim)",
                      letterSpacing: "0.09em",
                      textAlign: "left",
                      fontWeight: 400,
                      borderBottom: "1px solid var(--border)",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid rgba(21,25,41,0.5)" }}
                >
                  <td style={{ padding: "11px 16px" }}>
                    <Link
                      href={`/${d.domain}`}
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--text)",
                        textDecoration: "none",
                      }}
                    >
                      {d.domain}
                    </Link>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <Chip label={d.tld} color={CAT_COLOR[d.category] || "var(--cyan)"} size="xs" />
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>
                      {d.length} chars
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)" }}>
                      {fmtDate(d.dropTime) ?? "—"}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--purple)" }}>
                      {d.backlinks?.toLocaleString() ?? "—"}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: 14,
                        color: valColor(d.estimatedValue),
                      }}
                    >
                      {d.estimatedValue > 0 ? `$${d.estimatedValue.toLocaleString()}` : "—"}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <Link
                      href={`/${d.domain}`}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--accent)",
                        background: "var(--card2)",
                        border: "1px solid var(--border2)",
                        padding: "5px 11px",
                        borderRadius: 6,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                      }}
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
