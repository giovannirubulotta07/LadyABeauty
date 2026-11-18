import { addressLines } from "@/lib/address";
import { getBusinessInfo } from "@/server/content/queries";
import { HeaderBar } from "./header-bar";
import { MobileNav } from "./mobile-nav";
import { ACCOUNT_LINK, BOOKING_LINK, MAIN_NAV } from "./navigation";

export async function Header() {
  const business = await getBusinessInfo();
  return (
    <HeaderBar
      name={business.name}
      menu={
        <MobileNav
          links={MAIN_NAV}
          account={ACCOUNT_LINK}
          booking={BOOKING_LINK}
          addressLines={addressLines(business.address)}
          instagramUrl={business.instagramUrl}
          logoUrl={business.logoUrl}
        />
      }
    />
  );
}
