import { Suspense } from "react";
import { PageCoat } from "@/components/fur/page-coat";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ScrollManager } from "@/components/motion/scroll-manager";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-50 rounded-control bg-ivory px-4 py-3 text-espresso-900 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <PageCoat />
      <Header />
      <main id="contenu" tabIndex={-1} className="site-main outline-none">
        {children}
      </main>
      <Footer />
      {/* Reads the route to re-bind animations after client navigations. */}
      <Suspense fallback={null}>
        <MotionProvider />
        <ScrollManager />
      </Suspense>
    </>
  );
}
