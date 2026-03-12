/** @type {import('next').NextConfig} */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://packetally.com";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",                          // Next.js needs unsafe-inline
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://api.anthropic.com https://rdap.org https://rdap.cloudflare.com https://*.upstash.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",    value: CSP },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "X-Frame-Options",            value: "DENY" },
          { key: "X-XSS-Protection",           value: "1; mode=block" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security",  value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/favicon.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },

  // Redirect bare brand searches to search page for clarity
  async redirects() {
    return [];
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
