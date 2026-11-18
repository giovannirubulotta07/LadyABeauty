import type { MetadataRoute } from "next";
import { env } from "@/server/env";

const PUBLIC_PATHS = [
  "/",
  "/prestations",
  "/galerie",
  "/reserver",
  "/mentions-legales",
  "/confidentialite",
  "/cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: new URL(path, env.NEXT_PUBLIC_SITE_URL).toString(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
