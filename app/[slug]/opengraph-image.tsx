import { ImageResponse } from "next/og";
import { classifySlug } from "@/lib/validate";

export const runtime = "edge";
export const size    = { width: 1200, height: 630 };
export const alt     = "WhosMetric Domain Intelligence";

export default function OGImage({ params }: { params: { slug: string } }) {
  const classified = classifySlug(decodeURIComponent(params.slug));
  const display    = classified?.value ?? params.slug;
  const isAvailable  = false; // We don't block on RDAP here — keep OG fast

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg, #04050C 0%, #07091A 60%, #0D0B2A 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "flex-start", justifyContent: "space-between",
          padding: "60px 72px", fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "20%", left: "40%",
          width: 600, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(24,0,224,0.35) 0%, transparent 70%)",
        }} />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 11, background: "#1800E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Sparkle mark */}
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
              <path fill="white" d="M50 8C48 8 45 34 40 42C34 50 8 48 8 50C8 52 34 50 40 58C45 66 48 92 50 92C52 92 55 66 60 58C66 50 92 52 92 50C92 48 66 50 60 42C55 34 52 8 50 8Z" />
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
            Packet<span style={{ color: "#00CFFF" }}>ally</span>
          </span>
          <span style={{ fontSize: 12, color: "#7080A0", fontFamily: "monospace", letterSpacing: "0.1em", marginTop: 4 }}>
            DOMAIN INTELLIGENCE
          </span>
        </div>

        {/* Main domain display */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
          <div style={{ fontSize: 13, fontFamily: "monospace", color: "#7080A0", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {classified?.type === "domain" ? "Domain Intelligence Report" : "Brand Portfolio"}
          </div>
          <div style={{ fontSize: "clamp(40px, 5vw, 68px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            {display}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {["RDAP Lookup", "AI Brand Score", "TLD Availability", "Affiliate Links"].map((tag) => (
              <div key={tag} style={{ background: "rgba(91,117,255,0.15)", border: "1px solid rgba(91,117,255,0.35)", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontFamily: "monospace", color: "#5B75FF" }}>
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-end" }}>
          <span style={{ fontSize: 14, color: "#353D60", fontFamily: "monospace" }}>whosmetric.com</span>
          <span style={{ fontSize: 12, color: "#353D60", fontFamily: "monospace" }}>RDAP · Claude AI · Affiliate-Ready</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
