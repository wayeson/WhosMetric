"use client";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px", textAlign: "center" }} role="alert">
      <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>

      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 32, color: "#fff", marginBottom: 12 }}>
        Something went wrong
      </h1>

      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--dim)", lineHeight: 1.7, marginBottom: 10 }}>
        We hit an unexpected error. This is likely a temporary issue.
      </p>

      {error.digest && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 28 }}>
          Error ID: {error.digest}
        </p>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={reset}
          style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#fff", background: "linear-gradient(135deg, var(--brand), var(--brand-lt))", border: "none", padding: "10px 20px", borderRadius: 9, cursor: "pointer" }}
        >
          Try again
        </button>
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--text)", background: "var(--card2)", border: "1px solid var(--border2)", padding: "10px 20px", borderRadius: 9 }}>
          ← Home
        </Link>
      </div>
    </div>
  );
}
