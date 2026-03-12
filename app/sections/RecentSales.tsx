import { getRecentSales } from "@/lib/claude";
import { Card, CardHeader, Chip, ErrorState, EmptyState } from "@/components/ui/Card";
import type { DomainSaleRecord } from "@/lib/types";

export const revalidate = 3600;

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = iso.includes("T") ? iso : `${iso}T00:00:00Z`;
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
}

const CAT_COLOR: Record<string, string> = {
  Tech: "var(--cyan)", Finance: "var(--gold)", AI: "var(--purple)",
  Gaming: "var(--green)", Media: "var(--orange)", Health: "var(--green)",
};

export default async function RecentSales() {
  let data: DomainSaleRecord[] | null = null;
  let isError = false;

  try {
    data = await getRecentSales();
  } catch {
    isError = true;
  }

  return (
    <Card accent="var(--gold)" style={{ marginBottom: 16 }}>
      <CardHeader
        icon="💰"
        title="Recent Domain Sales"
        sub="Latest verified sales · NameBio · Sedo · Afternic · GoDaddy Auctions"
        right={<Chip label="30 DAYS" color="var(--gold)" size="xs" />}
      />

      {isError && (
        <ErrorState
          title="Could not load recent sales"
          sub="Sale data may be temporarily unavailable."
        />
      )}

      {!isError && (!data || data.length === 0) && (
        <EmptyState
          icon="💸"
          title="No recent sales found"
          sub="Market data is updated periodically."
        />
      )}

      {!isError && data && data.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse" }}
            aria-label="Recent domain sales"
          >
            <thead>
              <tr>
                {["Domain", "Sale Price", "Date", "Marketplace", "Category", "Notes"].map(h => (
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
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(21,25,41,0.5)" }}>
                  <td style={{ padding: "11px 16px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--text)",
                      }}
                    >
                      {d.domain}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: 15,
                        color: "var(--gold)",
                      }}
                    >
                      ${(d.price || 0).toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--dim)" }}>
                      {fmtDate(d.saleDate) ?? "—"}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <Chip label={d.marketplace || "—"} color="var(--accent)" size="xs" />
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    {d.category
                      ? <Chip label={d.category} color={CAT_COLOR[d.category] || "var(--accent)"} size="xs" />
                      : <span style={{ color: "var(--dim)" }}>—</span>}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--dim)" }}>
                      {d.notes || "—"}
                    </span>
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
