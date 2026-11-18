import { cacheLife } from "next/cache";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { InstagramIcon } from "@/components/ui/icons";
import { LeopardBand } from "@/components/ui/leopard-band";
import { addressLines, instagramHandle, mapsUrl } from "@/lib/address";
import { getBusinessInfo, getOpeningHours } from "@/server/content/queries";
import { ACCOUNT_LINK, BOOKING_LINK, LEGAL_NAV, MAIN_NAV } from "./navigation";
import { OpeningHoursList } from "./opening-hours-list";

async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export async function Footer() {
  const [business, hours] = await Promise.all([
    getBusinessInfo(),
    getOpeningHours(),
  ]);
  const linkClass =
    "inline-flex min-h-11 items-center text-sand-100 transition-colors hover:text-caramel-300";

  return (
    <footer className="surface-dark bg-espresso-950 text-sand-100">
      <LeopardBand />
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-3xl text-ivory">{business.name}</p>
          <p className="mt-3 text-sm leading-relaxed">{business.tagline}</p>
          {business.instagramUrl ? (
            <a
              href={business.instagramUrl}
              className={`${linkClass} mt-4 gap-2`}
              rel="noopener"
            >
              <InstagramIcon />
              {instagramHandle(business.instagramUrl)}
            </a>
          ) : null}
        </div>

        <div>
          <h2 className="label text-caramel-300">Le studio</h2>
          <address className="mt-4 text-sm leading-relaxed not-italic">
            {addressLines(business.address).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <a
            href={mapsUrl(business.name, business.address)}
            className={`${linkClass} text-sm underline underline-offset-4`}
            rel="noopener"
          >
            Itinéraire
          </a>
        </div>

        <div>
          <h2 className="label text-caramel-300">Horaires</h2>
          <OpeningHoursList
            hours={hours}
            tone="dark"
            className="mt-2 text-sm"
          />
        </div>

        <nav aria-label="Liens du pied de page">
          <h2 className="label text-caramel-300">Navigation</h2>
          <ul className="mt-2 text-sm">
            {[BOOKING_LINK, ...MAIN_NAV, ACCOUNT_LINK].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="border-t border-sand-100/15">
        <Container className="flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> {business.name}
          </p>
          <ul className="flex flex-wrap gap-x-6">
            {LEGAL_NAV.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
