import { getDomainNews } from "@/lib/claude";
import { Card, CardHeader, Chip, ErrorState, EmptyState } from "@/components/ui/Card";
import type { DomainNewsItem } from "@/lib/types";

export const revalidate = 1800; // 30 min — news changes faster

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = iso.includes("T") ? iso : `${iso}T00:00:00Z`;
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
}

const CAT_COLOR: Record<string, string> = {
  Policy:     "var(--purple)",
  Market:     "var(--gold)",
  Technology: "var(--cyan)",
  ICANN:      "var(--accent)",
  Investment: "var(--green)",
};

export default async function DomainNews() {
  let data: DomainNewsItem[] | null = null;
  let isError = false;

  try {
    data = await getDomainNews();
  } catch {
    isError = true;
  }

  return (
    <Card accent="var(--purple)" style={{ marginBottom: 16 }}>
      <CardHeader
        icon="📰"
        title="Domain Industry News"
        sub="Domain Incite · NamePros · ICANN · Domain Name Wire"
        right={<Chip label="14 DAYS" color="var(--purple)" size="xs" />}
      />

      {isError && (
        <ErrorState
          title="Could not load domain news"
          sub="News aggregation is temporarily unavailable."
        />
      )}

      {!isError && (!data || data.length === 0) && (
        <EmptyState icon="🗞️" title="No recent news found" sub="Check back soon." />
      )}

      {!isError && data && data.length > 0 && (
        <div>
          {data.map((item, i) => (
            <article
              key={i}
              style={{
                padding: "13px 18px",
                borderBottom: i < data!.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--text)",
                      textDecoration: "none",
                      flex: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.title}
                  </a>
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--text)",
                      flex: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.title}
                  </span>
                )}
                {item.category && (
                  <Chip
                    label={item.category}
                    color={CAT_COLOR[item.category] || "var(--accent)"}
                    size="xs"
                  />
                )}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "var(--dim)",
                  lineHeight: 1.65,
                  marginBottom: 7,
                }}
              >
                {item.summary}
              </p>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {item.source && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>
                    {item.source}
                  </span>
                )}
                {item.date && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>
                    {fmtDate(item.date)}
                  </span>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--accent)",
                      textDecoration: "none",
                    }}
                  >
                    Read more →
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
