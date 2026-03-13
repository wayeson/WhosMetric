"use client";
import { useState, useEffect, useCallback } from "react";

interface WatchButtonProps {
  domain: string;
}

export default function WatchButton({ domain }: WatchButtonProps) {
  const [watching, setWatching] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [msg,      setMsg]      = useState<string | null>(null);

  // Check if already watched on mount
  useEffect(() => {
    fetch("/api/watchlist")
      .then(r => r.json())
      .then((d: { domains: string[] }) => {
        setWatching(d.domains.includes(domain));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [domain]);

  const toggle = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      if (watching) {
        await fetch(`/api/watchlist?domain=${encodeURIComponent(domain)}`, { method: "DELETE" });
        setWatching(false);
        setMsg("Removed from watchlist");
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });
        setWatching(true);
        setMsg("Added to watchlist");
      }
    } catch {
      setMsg("Something went wrong");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }, [domain, watching]);

  const label = loading
    ? "…"
    : watching
    ? "★ Watching"
    : "☆ Watch";

  const style: React.CSSProperties = {
    display:    "inline-flex",
    alignItems: "center",
    gap:        6,
    fontFamily: "var(--font-mono)",
    fontWeight: 500,
    fontSize:   12,
    padding:    "8px 16px",
    borderRadius: 8,
    border:     `1px solid ${watching ? "rgba(0,230,118,0.45)" : "var(--border2)"}`,
    background:  watching ? "rgba(0,230,118,0.1)" : "var(--card2)",
    color:       watching ? "var(--green)" : "var(--dim)",
    cursor:      loading ? "default" : "pointer",
    transition:  "all 0.2s",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={watching ? `Stop watching ${domain}` : `Watch ${domain} for availability changes`}
        aria-pressed={watching}
        style={style}
      >
        {label}
      </button>
      {msg && (
        <span
          role="status"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--dim)",
          }}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
