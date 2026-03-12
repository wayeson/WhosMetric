import type { ReactNode, CSSProperties } from "react";

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  accent?: string;
  className?: string;
}

export function Card({ children, style = {}, accent, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {accent && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: accent,
          }}
        />
      )}
      {children}
    </div>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title: string;
  sub?: string;
  icon?: string;
  right?: ReactNode;
}

export function CardHeader({ title, sub, icon, right }: CardHeaderProps) {
  return (
    <div
      style={{
        padding: "14px 18px 12px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--dim)",
              marginTop: 3,
              letterSpacing: "0.06em",
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

// ─── DataRow ──────────────────────────────────────────────────────────────────

interface DataRowProps {
  label: string;
  value: string | null | undefined;
  copyValue?: string | null;
}

export function DataRow({ label, value, copyValue }: DataRowProps) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--dim)",
          flexShrink: 0,
          marginRight: 10,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text)",
            textAlign: "right",
            wordBreak: "break-all",
          }}
        >
          {value}
        </span>
        {copyValue && (
          // CopyButton is client — rendered separately; pass value as data attr trick
          // In RSC context, we just render the value. CopyButton wraps this in client pages.
          <span data-copy={copyValue} />
        )}
      </div>
    </div>
  );
}

// ─── State components ─────────────────────────────────────────────────────────

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      style={{
        padding: "36px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
      aria-label={label}
    >
      <div
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          border: "2px solid var(--border2)",
          borderTopColor: "var(--cyan)",
          borderRadius: "50%",
          animation: "pk-spin .6s linear infinite",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--dim)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function ErrorState({
  title = "Could not load data",
  sub = "This is usually temporary — try refreshing.",
}: {
  title?: string;
  sub?: string;
}) {
  return (
    <div style={{ padding: "32px 20px", textAlign: "center" }} role="alert">
      <div style={{ fontSize: 26, marginBottom: 10 }}>⚠️</div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 13,
          color: "var(--text)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "var(--dim)",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = "📭",
  title,
  sub,
}: {
  icon?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div style={{ padding: "36px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 14,
          color: "var(--text)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--dim)",
            maxWidth: 280,
            margin: "0 auto",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

export function Chip({
  label,
  color = "var(--cyan)",
  size = "sm",
}: {
  label: string;
  color?: string;
  size?: "xs" | "sm" | "md";
}) {
  const fs   = size === "xs" ? 9 : size === "sm" ? 10 : 11;
  const px   = size === "xs" ? 6 : size === "sm" ? 9 : 12;
  const py   = size === "xs" ? 2 : 3;
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: fs,
        letterSpacing: "0.04em",
        padding: `${py}px ${px}px`,
        borderRadius: 5,
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {label}
    </span>
  );
}
