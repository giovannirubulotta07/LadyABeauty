import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getBusinessInfo } from "@/server/content/queries";
import { Brand } from "./brand";
import { MobileNav } from "./mobile-nav";
import { ACCOUNT_LINK, BOOKING_LINK, MAIN_NAV } from "./navigation";

export async function Header() {
  const business = await getBusinessInfo();

  return (
    <header className="surface-dark sticky top-0 z-40 border-b border-caramel-300/15 bg-espresso-900 text-ivory">
      <Container className="flex h-16 items-center justify-between gap-3 lg:h-20">
        <Brand name={business.name} logoUrl={business.logoUrl} />

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {MAIN_NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="label inline-flex min-h-11 items-center text-sand-100 transition-colors hover:text-caramel-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-4">
          <Link
            href={ACCOUNT_LINK.href}
            className="label hidden min-h-11 items-center text-sand-100 transition-colors hover:text-caramel-300 lg:inline-flex"
          >
            {ACCOUNT_LINK.label}
          </Link>
          <ButtonLink
            href={BOOKING_LINK.href}
            variant="light"
            className="px-3 tracking-[0.12em] sm:px-6 sm:tracking-[0.16em]"
          >
            <span className="sm:hidden">Réserver</span>
            <span className="hidden sm:inline">{BOOKING_LINK.label}</span>
          </ButtonLink>
          <MobileNav
            links={MAIN_NAV}
            account={ACCOUNT_LINK}
            booking={BOOKING_LINK}
          />
        </div>
      </Container>
    </header>
  );
}
