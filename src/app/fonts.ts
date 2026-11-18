import { Bodoni_Moda, Jost } from "next/font/google";

// Only the "latin" subset is preloaded (it covers French accents); other
// subsets stay available through unicode-range without competing with the
// hero image for bandwidth.

/** High-contrast Didone for headings. */
export const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bodoni",
  display: "swap",
});

/** Clean geometric sans for body text and UI. */
export const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});
