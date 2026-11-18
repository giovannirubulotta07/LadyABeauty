import type { MetadataRoute } from "next";
import { getGallery } from "@/server/content/queries";
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

/** Public pages, with Alessia's photos attached to the pages that show them (Google Images). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = env.NEXT_PUBLIC_SITE_URL;
  const photos = (await getGallery()).map((img) =>
    new URL(img.src, site).toString(),
  );
  return PUBLIC_PATHS.map((path) => ({
    url: new URL(path, site).toString(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority:
      path === "/"
        ? 1
        : ["/prestations", "/reserver", "/galerie"].includes(path)
          ? 0.8
          : 0.3,
    ...(path === "/" || path === "/galerie" ? { images: photos } : {}),
  }));
}
