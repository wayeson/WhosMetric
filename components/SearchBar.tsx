"use client";
import { useState, useId } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  compact?: boolean;
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({
  compact = false,
  placeholder = "Search a domain or brand name…",
  initialValue = "",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError]  = useState<string | null>(null);
  const router = useRouter();
  const inputId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/\/$/, "");
    if (!q) { setError("Please enter a domain or brand name."); return; }
    if (q.length > 100) { setError("Query is too long."); return; }
    setError(null);
    router.push(`/${encodeURIComponent(q)}`);
  };

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Quick domain search"
        style={{ display: "flex", gap: 6 }}
      >
        <label htmlFor={inputId} className="sr-only">Search domain or brand</label>
        <input
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a domain…"
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1, background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "7px 12px", fontFamily: "var(--font-mono)",
            fontSize: 12, color: "var(--text)",
          }}
        />
        <button
          type="submit"
          aria-label="Search"
          style={{
            background: "var(--brand)", color: "#fff", padding: "7px 13px",
            borderRadius: 7, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12,
          }}
        >→</button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Domain or brand search"
      className="pk-search-wrap"
    >
      <label htmlFor={inputId} className="sr-only">Search a domain or brand name</label>
      <input
        id={inputId}
        className="pk-search-input"
        value={value}
        onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-describedby={error ? `${inputId}-error` : undefined}
        aria-invalid={error ? "true" : undefined}
      />
      <button type="submit" className="pk-search-btn">Search →</button>
      {error && (
        <div
          id={`${inputId}-error`}
          role="alert"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)", marginTop: 6, paddingLeft: 4 }}
        >
          {error}
        </div>
      )}
    </form>
  );
}
