/**
 * Renders the leopard band used at the top of e-mails as a PNG (e-mail
 * clients do not support SVG backgrounds). 1200×24 = 600×12 at 2x.
 * Usage: npx tsx scripts/email-band.mts
 */
import sharp from "sharp";

const tile = await sharp("public/patterns/leopard.svg")
  .resize(300, 300)
  .png()
  .toBuffer();
const strip = await sharp({
  create: { width: 1200, height: 300, channels: 4, background: "#c08a55" },
})
  .composite([0, 300, 600, 900].map((left) => ({ input: tile, left, top: 0 })))
  .png()
  .toBuffer();
await sharp(strip)
  .extract({ left: 0, top: 76, width: 1200, height: 24 })
  .png({ palette: true })
  .toFile("public/email/bande-leopard.png");
console.log("public/email/bande-leopard.png");
