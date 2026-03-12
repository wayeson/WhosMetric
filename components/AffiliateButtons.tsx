import type { AffiliateLink } from "@/lib/types";

interface RegistrarMeta {
  label: string;
  color: string;
  emoji: string;
}

const REGISTRAR_META: Record<string, RegistrarMeta> = {
  NAMECHEAP:  { label: "Namecheap",  color: "#DE3723", emoji: "🟥" },
  DYNADOT:    { label: "Dynadot",    color: "#0066CC", emoji: "🔵" },
  SPACESHIP:  { label: "Spaceship",  color: "#7C3AED", emoji: "🚀" },
  GODADDY:    { label: "GoDaddy",    color: "#00A651", emoji: "🟢" },
  PORKBUN:    { label: "Porkbun",    color: "#EF6C00", emoji: "🐷" },
};

interface AffiliateButtonsProps {
  links: AffiliateLink[];
  variant?: "full" | "compact";
}

export default function AffiliateButtons({ links, variant = "full" }: AffiliateButtonsProps) {
  if (!links.length) return null;

  if (variant === "compact") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="list" aria-label="Register this domain">
        {links.slice(0, 3).map(({ name, url }) => {
          const meta = REGISTRAR_META[name] ?? { label: name, color: "var(--accent)", emoji: "🌐" };
          return (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              role="listitem"
              aria-label={`Register on ${meta.label} (opens in new tab)`}
              style={{
                fontFamily: "var(--font-mono)", fontSize: 10, padding: "4px 10px",
                background: `${meta.color}15`, color: meta.color,
                border: `1px solid ${meta.color}35`, borderRadius: 5,
                textDecoration: "none", transition: "opacity 0.15s",
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.8"; }}
              onMouseOut={(e)  => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            >
              <span aria-hidden="true">{meta.emoji}</span> {meta.label}
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <section aria-label="Register this domain">
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Register this domain
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }} role="list">
        {links.map(({ name, url }, i) => {
          const meta = REGISTRAR_META[name] ?? { label: name, color: "var(--accent)", emoji: "🌐" };
          return (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              role="listitem"
              aria-label={`Register on ${meta.label} (opens in new tab)`}
              className={`aff-btn ${i === 0 ? "aff-btn-primary" : "aff-btn-secondary"}`}
              style={i !== 0 ? { borderColor: `${meta.color}40`, color: meta.color } : {}}
            >
              <span aria-hidden="true">{meta.emoji}</span>
              <span>{meta.label}</span>
              <span aria-hidden="true" style={{ fontSize: 11, opacity: 0.65 }}>→</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
