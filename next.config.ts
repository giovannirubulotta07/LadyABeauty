import type { NextConfig } from "next";

// Photos uploaded from the admin live in Supabase Storage (public "media" bucket).
const supabaseUrl = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
);
const localSupabase = ["127.0.0.1", "localhost"].includes(supabaseUrl.hostname);

const nextConfig: NextConfig = {
  cacheComponents: true,
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
