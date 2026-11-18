export type NavLink = { href: string; label: string };

export const MAIN_NAV: NavLink[] = [
  { href: "/prestations", label: "Prestations" },
  { href: "/galerie", label: "Galerie" },
  { href: "/#a-propos", label: "À propos" },
  { href: "/#studio", label: "Le studio" },
];

export const ACCOUNT_LINK: NavLink = {
  href: "/mon-espace",
  label: "Mon espace",
};
export const BOOKING_LINK: NavLink = {
  href: "/reserver",
  label: "Prendre rendez-vous",
};

export const LEGAL_NAV: NavLink[] = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
];
