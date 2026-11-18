/**
 * Warm, editorial colour grade of Alessia's real photos for the editorial
 * slots of the home page (the gallery keeps the untouched originals).
 * Only colour and tone are adjusted — never the result itself.
 * Usage: npx tsx scripts/grade-photos.mts
 */
import sharp from "sharp";

const photos = ["regard-01", "regard-03", "regard-04", "regard-06"];

for (const name of photos) {
  await sharp(`public/galerie/${name}.jpg`)
    .recomb([
      [1.05, 0.02, 0],
      [0.01, 0.99, 0],
      [0, 0.02, 0.9],
    ])
    .modulate({ saturation: 0.9, brightness: 0.97 })
    .linear(1.06, -6)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(`public/editorial/${name}-editorial.jpg`);
  console.log(`public/editorial/${name}-editorial.jpg`);
}
