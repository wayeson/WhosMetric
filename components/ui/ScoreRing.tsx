"use client";

interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score = 0, size = 88 }: ScoreRingProps) {
  const r     = size / 2 - 8;
  const circ  = 2 * Math.PI * r;
  const pct   = Math.min(Math.max(score, 0), 100);
  const dash  = (pct / 100) * circ;
  const color =
    score >= 75 ? "var(--green)"
    : score >= 55 ? "var(--cyan)"
    : score >= 35 ? "var(--gold)"
    : "var(--red)";

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
      aria-label={`Brand score: ${score} out of 100`}
      role="img"
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border2)"
          strokeWidth={5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: size * 0.22,
            color,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        <span
          style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)" }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

interface ScoreBarProps {
  label: string;
  value: number;
}

export function ScoreBar({ label, value = 0 }: ScoreBarProps) {
  const color =
    value >= 75 ? "var(--green)"
    : value >= 55 ? "var(--cyan)"
    : value >= 35 ? "var(--gold)"
    : "var(--red)";

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--dim)",
          width: 112,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div
        style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--border2)" }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            width: `${value}%`,
            background: color,
            transition: "width 0.9s ease",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text)",
          width: 26,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
