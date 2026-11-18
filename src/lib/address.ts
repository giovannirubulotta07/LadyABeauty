type Address = {
  line1: string;
  line2: string | null;
  postalCode: string;
  city: string;
};

export function addressLines(a: Address): string[] {
  return [a.line1, a.line2, `${a.postalCode} ${a.city}`].filter(
    (l): l is string => Boolean(l),
  );
}

/** Google Maps search link (no API key, no personal data). */
export function mapsUrl(businessName: string, a: Address): string {
  const query = [businessName, ...addressLines(a)].join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** "https://www.instagram.com/lady.a_beauty/" → "@lady.a_beauty" */
export function instagramHandle(url: string): string {
  const match = /instagram\.com\/([^/?#]+)/i.exec(url);
  return match?.[1] ? `@${match[1]}` : url;
}
