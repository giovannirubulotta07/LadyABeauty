/**
 * Prepares the gallery photos taken from the current website:
 * removes the phone status bars / black bands of the screenshots and
 * exports uniform 3:4 JPEGs into public/galerie.
 *
 * Usage: npm run images:gallery
 */
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "docs/assets/sito-attuale";
const OUTPUT_DIR = "public/galerie";
const OUTPUT_WIDTH = 900;
const OUTPUT_HEIGHT = 1200;

type Source = {
  file: string;
  /** Vertical band (in source pixels) that contains the actual photo. */
  top: number;
  bottom: number;
  /** Where to center the 3:4 crop inside that band, 0 = top, 1 = bottom. */
  focusY?: number;
};

const SOURCES: Source[] = [
  { file: "galerie-01-IMG_8228.jpg", top: 0, bottom: 2732, focusY: 0.55 },
  { file: "galerie-02-IMG_0530.jpg", top: 250, bottom: 2474 },
  { file: "galerie-03-IMG_8223.jpg", top: 95, bottom: 1561, focusY: 0.45 },
  { file: "galerie-04-IMG_0526.jpg", top: 250, bottom: 2474, focusY: 0.4 },
  { file: "galerie-05-IMG_0429.jpg", top: 250, bottom: 2484, focusY: 0.35 },
  { file: "galerie-06-IMG_0428.jpg", top: 458, bottom: 1965 },
];

async function prepare(source: Source, index: number): Promise<void> {
  const input = sharp(path.join(SOURCE_DIR, source.file));
  const { width } = await input.metadata();
  if (!width) throw new Error(`Unreadable image: ${source.file}`);

  const bandHeight = source.bottom - source.top;
  // Largest 3:4 rectangle that fits in the band.
  const cropWidth = Math.min(width, Math.floor((bandHeight * 3) / 4));
  const cropHeight = Math.floor((cropWidth * 4) / 3);
  const left = Math.floor((width - cropWidth) / 2);
  const slack = bandHeight - cropHeight;
  const top = source.top + Math.round(slack * (source.focusY ?? 0.5));

  const output = path.join(
    OUTPUT_DIR,
    `regard-${String(index + 1).padStart(2, "0")}.jpg`,
  );
  await input
    .rotate()
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: "cover" })
    .withMetadata({}) // strips EXIF (device, date) — keeps the colour profile
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(output);
  console.log(`${source.file} → ${output}`);
}

await Promise.all(SOURCES.map(prepare));
