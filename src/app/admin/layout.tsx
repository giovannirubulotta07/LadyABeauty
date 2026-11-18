import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav, AdminNavList } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration" },
  robots: { index: false, follow: false },
};

/**
 * Admin shell: phone first (bottom tab bar), side rail on desktop.
 * The shell is static; each page checks access itself (<AdminGate>).
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-sand-50 text-ink">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-control bg-ivory px-4 py-3 text-espresso-900 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <header className="sticky top-0 z-30 bg-espresso-950 text-ivory lg:fixed lg:inset-y-0 lg:left-0 lg:w-60">
        <div className="flex h-14 items-center justify-between px-4 lg:h-20 lg:px-6">
          <Link href="/admin" className="leading-tight">
            <span className="block font-display text-lg">Lady A Beauty</span>
            <span className="block text-[0.625rem] tracking-[0.25em] text-sand-100/75 uppercase">
              Administration
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-xs tracking-wide text-sand-100/80 underline-offset-4 hover:text-ivory hover:underline lg:hidden"
          >
            Voir le site
          </Link>
        </div>
        <nav aria-label="Administration" className="hidden lg:block">
          <Suspense
            fallback={<AdminNavList placement="rail" pathname={null} />}
          >
            <AdminNav placement="rail" />
          </Suspense>
          <Link
            href="/"
            className="mx-6 mt-6 inline-flex min-h-11 items-center text-xs tracking-wide text-sand-100/75 hover:text-ivory"
          >
            Voir le site →
          </Link>
        </nav>
      </header>

      <main
        id="contenu"
        tabIndex={-1}
        className="px-4 pt-6 pb-28 outline-none sm:px-6 lg:ml-60 lg:px-10 lg:pt-10 lg:pb-16"
      >
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <nav
        aria-label="Administration"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ivory/10 bg-espresso-950 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <Suspense fallback={<AdminNavList placement="bar" pathname={null} />}>
          <AdminNav placement="bar" />
        </Suspense>
      </nav>
    </div>
  );
}
