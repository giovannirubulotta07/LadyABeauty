import type { MetadataRoute } from "next";
import { env } from "@/server/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or personal pages (and pages reached only from an e-mail link).
      disallow: [
        "/admin",
        "/mon-espace",
        "/api/",
        "/auth/",
        "/rdv/",
        "/liste-attente/",
        "/reserver/confirmation",
        "/compte-supprime",
      ],
    },
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
