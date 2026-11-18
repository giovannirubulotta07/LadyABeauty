import type { Metadata, Viewport } from "next";
import { getBusinessInfo } from "@/server/content/queries";
import { env } from "@/server/env";
import { MOTION_BOOT_SCRIPT } from "@/components/motion/boot-script";
import { bodoni, jost } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusinessInfo();
  const description = `${business.tagline}. Extension de cils, rehaussement, browlift et soins du regard — réservation en ligne.`;
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: {
      default: `${business.name} — ${business.tagline}`,
      template: `%s · ${business.name}`,
    },
    description,
    applicationName: business.name,
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: business.name,
      title: business.name,
      description,
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#2b1a12",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${bodoni.variable} ${jost.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
