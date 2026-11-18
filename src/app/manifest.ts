import type { MetadataRoute } from "next";

/** Lets clients (and Alessia, for the admin) add the site to their phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lady A Beauty",
    short_name: "Lady A",
    description: "Lash maker & brow artist à Annemasse — réservation en ligne.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#1f130d",
    theme_color: "#2b1a12",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
