import { cacheLife } from "next/cache";
import Link from "next/link";
import { FurLayer } from "@/components/fur/fur-layer";
import { Container } from "@/components/ui/container";
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
  const link =
    "link-underline inline-flex min-h-11 items-center text-sand-100 transition-colors hover:text-ivory";

  return (
    <footer className="surface-dark relative overflow-hidden bg-espresso-950 text-sand-100">
      {/* Closing invitation */}
      <section
        aria-labelledby="footer-cta"
        className="relative overflow-hidden border-b border-ivory/10"
      >
        <FurLayer pattern="leopard" veil="band" />
        <Container className="relative flex max-w-[90rem] flex-col items-start gap-10 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label text-sand-100">Réservation en ligne</p>
            <h2
              id="footer-cta"
              data-reveal="lines"
              className="mt-6 max-w-3xl text-quote text-ivory"
            >
              Votre regard, sublimé dans le moindre détail.
            </h2>
          </div>
          <Link
            href={BOOKING_LINK.href}
            className="group inline-flex min-h-14 shrink-0 items-center gap-4 rounded-pill border border-ivory/40 px-8 text-[0.8125rem] tracking-[0.2em] text-ivory uppercase transition-colors duration-500 hover:border-ivory hover:bg-ivory hover:text-espresso-950"
          >
            {BOOKING_LINK.label}
            <span
              aria-hidden="true"
              className="transition-transform duration-500 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </Container>
      </section>

      {/* Practical details. The home page already shows them in « Venir au
          studio », so they are hidden there (globals.css: .footer-info). */}
      <Container className="grid max-w-[90rem] gap-x-12 gap-y-10 py-14 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr]">
        <div className="footer-info">
          <h2 className="label text-sand-100/80">Le studio</h2>
          <address className="mt-4 leading-relaxed text-ivory not-italic">
            {addressLines(business.address).join(", ")}
          </address>
          <div className="mt-1 flex flex-wrap gap-x-6 text-sm">
            <a
              href={mapsUrl(business.name, business.address)}
              className={link}
              rel="noopener"
            >
              Itinéraire
            </a>
            {business.instagramUrl ? (
              <a href={business.instagramUrl} className={link} rel="noopener">
                {instagramHandle(business.instagramUrl)}
              </a>
            ) : null}
          </div>
        </div>

        <div className="footer-info">
          <h2 className="label text-sand-100/80">Horaires</h2>
          <OpeningHoursList
            hours={hours}
            tone="dark"
            className="mt-2 text-sm"
          />
        </div>

        <nav aria-label="Liens du pied de page">
          <h2 className="label text-sand-100/80">Navigation</h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-6 text-sm">
            {[BOOKING_LINK, ...MAIN_NAV, ACCOUNT_LINK].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={link}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="border-t border-ivory/10">
        <Container className="flex max-w-[90rem] flex-col gap-3 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> {business.name}
          </p>
          <ul className="flex flex-wrap gap-x-6">
            {LEGAL_NAV.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={link}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
