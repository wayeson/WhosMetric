"use client";
import { useEffect, useRef, useState } from "react";
import type { TLDTrendItem } from "@/lib/types";

// Fallback seed so ticker is never empty
const SEED: TLDTrendItem[] = [
  { tld: ".ai",      change30d: +34.2, trend: "up",   registrations: 850000, avgPrice: 89,  category: "Technology", notes: "" },
  { tld: ".io",      change30d: -2.1,  trend: "down", registrations: 310000, avgPrice: 45,  category: "Technology", notes: "" },
  { tld: ".com",     change30d: +0.8,  trend: "up",   registrations: 160000000, avgPrice: 12, category: "Generic", notes: "" },
  { tld: ".gg",      change30d: +41.2, trend: "up",   registrations: 89000,  avgPrice: 28,  category: "Gaming",     notes: "" },
  { tld: ".app",     change30d: +18.7, trend: "up",   registrations: 221000, avgPrice: 18,  category: "Technology", notes: "" },
  { tld: ".dev",     change30d: +11.4, trend: "up",   registrations: 183000, avgPrice: 14,  category: "Technology", notes: "" },
  { tld: ".co",      change30d: +3.2,  trend: "up",   registrations: 445000, avgPrice: 25,  category: "Generic",    notes: "" },
  { tld: ".xyz",     change30d: -5.8,  trend: "down", registrations: 612000, avgPrice: 1,   category: "Generic",    notes: "" },
  { tld: ".net",     change30d: -1.3,  trend: "down", registrations: 558000, avgPrice: 11,  category: "Generic",    notes: "" },
  { tld: ".tech",    change30d: +22.6, trend: "up",   registrations: 94000,  avgPrice: 35,  category: "Technology", notes: "" },
  { tld: ".finance", change30d: +28.9, trend: "up",   registrations: 21000,  avgPrice: 55,  category: "Finance",    notes: "" },
  { tld: ".org",     change30d: -0.6,  trend: "down", registrations: 384000, avgPrice: 10,  category: "Non-profit", notes: "" },
  { tld: ".me",      change30d: +7.3,  trend: "up",   registrations: 127000, avgPrice: 20,  category: "Personal",   notes: "" },
  { tld: ".club",    change30d: -3.2,  trend: "down", registrations: 78000,  avgPrice: 8,   category: "Community",  notes: "" },
];

interface TLDTickerProps {
  data?: TLDTrendItem[] | null;
}

const ITEM_W = 136; // px per ticker item

export default function TLDTicker({ data }: TLDTickerProps) {
  const items   = data?.length ? data : SEED;
  const doubled = [...items, ...items]; // duplicate for seamless loop
  const total   = items.length * ITEM_W;

  const [x, setX] = useState(0);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      setX(v => {
        const next = v - 0.45;
        return next < -total ? next + total : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [total]);

  return (
    <div
      role="marquee"
      aria-label="Trending TLD extensions"
      style={{
        background: "var(--bg-alt)",
        borderBottom: "1px solid var(--border)",
        overflow: "hidden",
        height: 32,
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Left fade */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 60, zIndex: 2,
          background: "linear-gradient(to right, var(--bg-alt), transparent)",
        }}
      />
      {/* Right fade */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 60, zIndex: 2,
          background: "linear-gradient(to left, var(--bg-alt), transparent)",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          transform: `translateX(${x}px)`,
          willChange: "transform",
        }}
      >
        {doubled.map((item, i) => {
          const up = item.change30d >= 0;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                width: ITEM_W,
                flexShrink: 0,
                padding: "0 14px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text)",
                  fontWeight: 500,
                  minWidth: 42,
                }}
              >
                {item.tld}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: up ? "var(--green)" : "var(--red)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <span>{up ? "▲" : "▼"}</span>
                <span>{Math.abs(item.change30d).toFixed(1)}%</span>
              </span>
              {item.registrations > 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--muted)",
                  }}
                >
                  {item.registrations >= 1_000_000
                    ? `${(item.registrations / 1_000_000).toFixed(1)}M`
                    : item.registrations >= 1000
                    ? `${(item.registrations / 1000).toFixed(0)}K`
                    : item.registrations}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
