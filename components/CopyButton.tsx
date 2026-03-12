"use client";
import { useState, useCallback } from "react";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export default function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = value;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [value]);

  return (
    <button
      onClick={copy}
      aria-label={copied ? "Copied!" : `Copy ${label ?? value}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: 4,
        background: copied ? "rgba(0,230,118,0.15)" : "var(--card2)",
        border: `1px solid ${copied ? "rgba(0,230,118,0.4)" : "var(--border)"}`,
        color: copied ? "var(--green)" : "var(--dim)",
        fontSize: 11,
        transition: "all 0.2s",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}
