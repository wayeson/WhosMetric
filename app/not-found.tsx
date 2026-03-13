import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { LogoMark } from "@/components/Logo";

export const metadata = {
  title: "Not Found | WhosMetric",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}>
        <LogoMark size={48} aria-hidden />
      </div>

      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px, 5vw, 48px)", color: "#fff", letterSpacing: "-0.03em", marginBottom: 12 }}>
        404
      </h1>

      <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--dim)", lineHeight: 1.7, marginBottom: 32 }}>
        Page not found. If you were searching for a domain or brand, try again below.
      </p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <SearchBar placeholder="Search a domain or brand name…" />
      </div>

      <Link href="/" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--dim)" }}>
        ← Back to home
      </Link>
    </div>
  );
}
