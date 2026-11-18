import type { Metadata } from "next";

export const SITE_NAME = "Lady A Beauty";

/**
 * Metadata for a public page. Next.js replaces (does not merge) the
 * `openGraph` object of the root layout, so each page sets its own complete
 * one: title, description and URL that match the page when it is shared.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: `/${string}`;
}): Metadata {
  const full = `${title} · ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: SITE_NAME,
      url: path,
      title: full,
      description,
    },
    twitter: { card: "summary_large_image", title: full, description },
  };
}
