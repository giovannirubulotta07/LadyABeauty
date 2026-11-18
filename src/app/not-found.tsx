import type { Metadata } from "next";
import SiteLayout from "./(site)/layout";
import SiteNotFound from "./(site)/not-found";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false },
};

/** Unknown addresses get the same page as the site's own 404: header, fur, footer. */
export default function NotFound() {
  return (
    <SiteLayout params={Promise.resolve({})}>
      <SiteNotFound />
    </SiteLayout>
  );
}
