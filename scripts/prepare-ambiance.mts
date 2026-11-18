/**
 * Atmosphere photos of the home page, from Pexels (free for commercial use,
 * no attribution required — https://www.pexels.com/license/).
 * Downloads the originals, crops them for their slot and warms them slightly.
 *
 * Usage: npx tsx scripts/prepare-ambiance.mts
 * Rule: gestures, tools, a salon — never another studio's results presented
 * as Alessia's work (her own photos stay in the gallery).
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const PHOTOS = [
  // Pexels id, output, crop on the 2000 px download, output size
  [
    "7755531",
    "ambiance-pose",
    { left: 540, top: 0, width: 1000, height: 1333 },
    1200,
    1600,
  ],
  [
    "7755523",
    "ambiance-mains",
    { left: 160, top: 0, width: 1000, height: 1333 },
    1200,
    1600,
  ],
  [
    "5128316",
    "ambiance-outils",
    { left: 260, top: 0, width: 1066, height: 1333 },
    1000,
    1250,
  ],
  [
    "30790460",
    "ambiance-salon-rose",
    { left: 0, top: 0, width: 2000, height: 2500 },
    1000,
    1250,
  ],
  [
    "5177994",
    "ambiance-sourcils",
    { left: 900, top: 0, width: 1067, height: 1334 },
    1000,
    1250,
  ],
  [
    "5128220",
    "ambiance-pose-gants",
    { left: 0, top: 160, width: 2000, height: 2667 },
    1200,
    1600,
  ],
] as const;

mkdirSync("public/editorial", { recursive: true });
for (const [id, name, crop, w, h] of PHOTOS) {
  const res = await fetch(
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`,
  );
  if (!res.ok) throw new Error(`Pexels ${id}: HTTP ${res.status}`);
  await sharp(Buffer.from(await res.arrayBuffer()))
    .extract(crop)
    .resize(w, h, { fit: "cover" })
    .modulate({ saturation: 0.94 })
    .recomb([
      [1.03, 0.01, 0],
      [0, 1.0, 0],
      [0, 0.01, 0.96],
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(`public/editorial/${name}.jpg`);
  console.log(`public/editorial/${name}.jpg ← pexels.com/photo/${id}`);
}
