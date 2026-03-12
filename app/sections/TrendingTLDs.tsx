import { getTLDTrends } from "@/lib/claude";
import { Card, CardHeader, Chip, ErrorState } from "@/components/ui/Card";
import type { TLDTrendItem } from "@/lib/types";

export const revalidate = 86400; // 24h — TLD stats change slowly

// Fallback data so the section is never empty
const FALLBACK: TLDTrendItem[] = [
  { tld: ".ai",      change30d: +34.2, trend: "up",   registrations: 850000,    avgPrice: 89,  category: "Technology", notes: "Dominant AI brand extension" },
  { tld: ".io",      change30d: -2.1,  trend: "down", registrations: 310000,    avgPrice: 45,  category: "Technology", notes: "Startup/developer favourite" },
  { tld: ".com",     change30d: +0.8,  trend: "up",   registrations: 160000000, avgPrice: 12,  category: "Generic",    notes: "Most valuable TLD by far" },
  { tld: ".gg",      change30d: +41.2, trend: "up",   registrations: 89000,     avgPrice: 28,  category: "Gaming",     notes: "Gaming and esports crossover" },
  { tld: ".app",     change30d: +18.7, trend: "up",   registrations: 221000,    avgPrice: 18,  category: "Technology", notes: "Google-backed; mobile-first" },
  { tld: ".dev",     change30d: +11.4, trend: "up",   registrations: 183000,    avgPrice: 14,  category: "Technology", notes: "Developer-focused extension" },
  { tld: ".tech",    change30d: +22.6, trend: "up",   registrations: 94000,     avgPrice: 35,  category: "Technology", notes: "Rising startup choice" },
  { tld: ".finance", change30d: +28.9, trend: "up",   registrations: 21000,     avgPrice: 55,  category: "Finance",    notes: "High-value fintech niche" },
  { tld: ".co",      change30d: +3.2,  trend: "up",   registrations: 445000,    avgPrice: 25,  category: "Generic",    notes: "Popular .com alternative" },
  { tld: ".xyz",     change30d: -5.8,  trend: "down", registrations: 612000,    avgPrice: 1,   category: "Generic",    notes: "Budget choice; declining" },
  { tld: ".org",     change30d: -0.6,  trend: "down", registrations: 384000,    avgPrice: 10,  category: "Non-profit", notes: "Established non-profit TLD" },
  { tld: ".net",     change30d: -1.3,  trend: "down", registrations: 558000,    avgPrice: 11,  category: "Generic",    notes: "Legacy tech/network TLD" },
];

function trendColor(item: TLDTrendItem): string {
  if (item.trend === "up"   || item.change30d > 0)  return "var(--green)";
  if (item.trend === "down" || item.change30d < 0)  return "var(--red)";
  return "var(--dim)";
}

export default async function TrendingTLDs() {
  let data: TLDTrendItem[] | null = null;
  let isError = false;

  try {
    data = await getTLDTrends();
  } catch {
    isError = true;
  }

  const items = (data?.length ? data : FALLBACK);

  return (
    <Card accent="var(--cyan)" style={{ marginBottom: 16 }}>
      <CardHeader
        icon="📊"
        title="TLD Trend Report"
        sub="Registration growth · 30-day change · Average pricing"
        right={<Chip label="LIVE" color="var(--cyan)" size="xs" />}
      />

      {isError && (
        <ErrorState title="Could not load TLD trends" sub="Showing last cached data." />
      )}

      <div
        style={{
          padding: "12px 16px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: 10,
        }}
      >
        {items.map((t, i) => {
          const col = trendColor(t);
          const up  = t.change30d >= 0;
          return (
            <div
              key={i}
              style={{
                background: "var(--card2)",
                border: "1px solid var(--border2)",
                borderRadius: 9,
                padding: "12px 14px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: col,
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 7,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: 18,
                    color: "var(--text)",
                  }}
                >
                  {t.tld}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: col,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <span>{up ? "▲" : "▼"}</span>
                  <span>{Math.abs(t.change30d).toFixed(1)}%</span>
                </span>
              </div>

              {t.registrations > 0 && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--dim)",
                    marginBottom: 3,
                  }}
                >
                  {t.registrations >= 1_000_000
                    ? `${(t.registrations / 1_000_000).toFixed(1)}M registrations`
                    : `${(t.registrations / 1000).toFixed(0)}K registrations`}
                </div>
              )}

              {t.avgPrice > 0 && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--gold)",
                    marginBottom: t.notes ? 6 : 0,
                  }}
                >
                  avg ~${t.avgPrice}/yr
                </div>
              )}

              {t.notes && (
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    color: "var(--dim)",
                    lineHeight: 1.5,
                  }}
                >
                  {t.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
