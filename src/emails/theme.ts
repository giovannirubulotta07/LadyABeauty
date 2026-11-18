/** E-mail styling: same palette as src/styles/tokens.css, written inline for mail clients. */
export const colors = {
  espresso: "#2b1a12",
  espressoMuted: "#614839",
  sand: "#eadccb",
  sandLine: "#dcc8b1",
  ivory: "#fbf7f0",
  caramel: "#7a4b20",
  caramelLight: "#d9ae7e",
  ink: "#16100c",
};

export const fonts = {
  display: "Didot, 'Bodoni 72', 'Bodoni MT', Georgia, 'Times New Roman', serif",
  body: "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif",
};

export type EmailBrand = {
  name: string;
  siteUrl: string;
  instagramUrl?: string | null;
  addressLine: string;
};

/** Everything an appointment e-mail shows, already formatted in French. */
export type AppointmentEmailData = {
  firstName: string;
  serviceName: string;
  variantName?: string | null;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  priceLabel?: string | null;
  address: string;
  mapsUrl: string;
  manageUrl?: string;
  icsUrl?: string;
};
