import type { NextConfig } from "next";

// Photos uploaded from the admin live in Supabase Storage (public "media" bucket).
const supabaseUrl = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
);
const localSupabase = ["127.0.0.1", "localhost"].includes(supabaseUrl.hostname);

// Security headers for every response. No full CSP: Next.js inline scripts
// would need per-request nonces, which would make every page dynamic.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Pages opened from a signed e-mail link: never leak the token to another site.
      ...["/rdv/:path*", "/liste-attente/:path*", "/api/ics/:path*"].map(
        (source) => ({
          source,
          headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
        }),
      ),
    ];
  },
  images: {
    remotePatterns: [
      new URL(`${supabaseUrl.origin}/storage/v1/object/public/media/**`),
    ],
    // Only for the local Supabase stack (development and tests).
    dangerouslyAllowLocalIP: localSupabase,
  },
  experimental: {
    // Photos are resized in the browser first (≤ 2400 px JPEG), so 4 MB is ample.
    serverActions: {
      bodySizeLimit: "4mb",
      // GitHub Codespaces serves the site through its own forwarding domain.
      ...(process.env.CODESPACES === "true"
        ? { allowedOrigins: ["*.app.github.dev"] }
        : {}),
    },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
