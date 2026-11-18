/**
 * Renders the original brand textures (draped silk, leopard silk, linen) with
 * WebGL in headless Chromium, then exports optimised JPEGs to public/editorial.
 * Usage: node scripts/textures/render.mjs
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const root = process.cwd();
const out = path.join(root, "public", "editorial");
mkdirSync(out, { recursive: true });

// 1024px PNG tile of the leopard pattern, fed to the shader as a texture.
const tile = await sharp(path.join(root, "public/patterns/leopard.svg"))
  .resize(1024, 1024)
  .png()
  .toBuffer();
const patternUrl = `data:image/png;base64,${tile.toString("base64")}`;

// Hero (landscape for desktop, portrait for phones) and collage tiles.
const jobs = JSON.parse(process.argv[2] ?? "null") ?? [
  { name: "hero-soie-paysage", mode: "silk", w: 3000, h: 1800, seed: 3 },
  { name: "hero-soie-portrait", mode: "silk", w: 1400, h: 2400, seed: 3 },
  { name: "soie-leopard-1", mode: "leopard", w: 1600, h: 2000, seed: 5 },
  { name: "soie-leopard-2", mode: "leopard", w: 1600, h: 1600, seed: 21 },
  { name: "soie-espresso-1", mode: "silk", w: 1600, h: 2000, seed: 13 },
  { name: "soie-espresso-2", mode: "silk", w: 1600, h: 1200, seed: 27 },
  { name: "satin-sable-1", mode: "linen", w: 1600, h: 2000, seed: 2 },
  { name: "satin-sable-2", mode: "linen", w: 1600, h: 1600, seed: 9 },
  { name: "bandeau-leopard", mode: "leopard", w: 3000, h: 1200, seed: 8 },
];

const browser = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.goto(`file://${path.join(root, "scripts/textures/silk.html")}`);
for (const j of jobs) {
  const dataUrl = await page.evaluate((params) => window.render(params), {
    ...j,
    pattern: patternUrl,
  });
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  await sharp(png)
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(path.join(out, `${j.name}.jpg`));
  console.log(`public/editorial/${j.name}.jpg`);
}
await browser.close();
