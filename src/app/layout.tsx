import type { Metadata, Viewport } from "next";
import { getBusinessInfo } from "@/server/content/queries";
import { env } from "@/server/env";
import { MOTION_BOOT_SCRIPT } from "@/components/motion/boot-script";
import { bodoni, jost } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusinessInfo();
  // What people search for: the service and the town (Annemasse, near Geneva).
  const description = `${business.name}, studio du regard à Annemasse, près de Genève : extension de cils, rehaussement, browlift et sourcils sur mesure. Réservation en ligne, confirmation immédiate.`;
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: {
      default: `${business.name} · Extension de cils & sourcils à Annemasse`,
      template: `%s · ${business.name}`,
    },
    description,
    applicationName: business.name,
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: "/",
      siteName: business.name,
      title: business.name,
      description,
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
    appleWebApp: { title: business.name, statusBarStyle: "black-translucent" },
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
