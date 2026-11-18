/**
 * Generates the brand's original leopard pattern as a seamless SVG tile.
 *
 * Irregular rosettes (broken rings around a darker centre) and small solid
 * spots are scattered with toroidal Poisson-disc sampling; every shape that
 * crosses an edge is drawn again on the opposite side, so the tile repeats
 * without visible seams. The output is deterministic (fixed seed).
 *
 * Usage: npx tsx scripts/generate-leopard.mts
 */
import { writeFileSync } from "node:fs";

const SIZE = 360;
const SEED = 20261118;

// Brand colours (see src/styles/tokens.css)
const CAMEL = "#c08a55";
const CENTRE = "#a46d3b";
const SPOT = "#2b1a12";

type Point = [number, number];

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(SEED);
const between = (min: number, max: number) => min + random() * (max - min);

const fmt = (n: number) => Math.round(n).toString();

/** Closed smooth path through points (quadratic curves between midpoints). */
function smoothPath(points: Point[], [dx, dy]: Point): string {
  const p = points.map(([x, y]) => [x + dx, y + dy] as Point);
  const mid = (a: Point, b: Point): Point => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];
  const n = p.length;
  const start = mid(p[n - 1]!, p[0]!);
  let d = `M${fmt(start[0])} ${fmt(start[1])}`;
  for (let i = 0; i < n; i++) {
    const ctrl = p[i]!;
    const end = mid(p[i]!, p[(i + 1) % n]!);
    d += `Q${fmt(ctrl[0])} ${fmt(ctrl[1])} ${fmt(end[0])} ${fmt(end[1])}`;
  }
  return `${d}Z`;
}

/** Organic blob: ellipse with radial noise. */
function blob(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation: number,
  wobble: number,
): Point[] {
  const count = 7;
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const k = 1 + between(-wobble, wobble);
    const x = Math.cos(a) * rx * k;
    const y = Math.sin(a) * ry * k;
    points.push([
      cx + x * Math.cos(rotation) - y * Math.sin(rotation),
      cy + x * Math.sin(rotation) + y * Math.cos(rotation),
    ]);
  }
  return points;
}

type Shape = {
  points: Point[];
  fill: string;
  radius: number;
  cx: number;
  cy: number;
};

function rosette(cx: number, cy: number, r: number): Shape[] {
  const shapes: Shape[] = [];
  const rotation = between(0, Math.PI);
  const squash = between(0.7, 0.92);
  // Low-frequency deformation so that no rosette is a circle.
  const p2 = between(0, Math.PI * 2);
  const p3 = between(0, Math.PI * 2);
  const a2 = between(0.08, 0.2);
  const a3 = between(0.04, 0.12);
  const radiusAt = (a: number) =>
    r * (1 + a2 * Math.sin(2 * a + p2) + a3 * Math.sin(3 * a + p3));
  const transform = ([x, y]: Point): Point => {
    const sy = y * squash;
    return [
      cx + x * Math.cos(rotation) - sy * Math.sin(rotation),
      cy + x * Math.sin(rotation) + sy * Math.cos(rotation),
    ];
  };

  // Darker centre following the same irregular outline
  const centre: Point[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const k = 0.7 * (1 + between(-0.07, 0.07));
    centre.push([Math.cos(a) * radiusAt(a) * k, Math.sin(a) * radiusAt(a) * k]);
  }
  shapes.push({
    points: centre.map(transform),
    fill: CENTRE,
    radius: r * 1.4,
    cx,
    cy,
  });

  // Broken ring: 2–5 thick, tapered, irregular fragments
  const fragments = 2 + Math.floor(random() * 4);
  let angle = between(0, Math.PI * 2);
  const gapTotal = between(0.7, 1.5);
  const arcTotal = Math.PI * 2 - gapTotal;
  const weights = Array.from({ length: fragments }, () => between(0.5, 1.5));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  for (const w of weights) {
    const span = (arcTotal * w) / weightSum;
    const thickness = r * between(0.36, 0.55);
    const steps = span > 1.6 ? 5 : 4;
    const outer: Point[] = [];
    const inner: Point[] = [];
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const a = angle + span * u;
      const taper = Math.pow(
        Math.sin(Math.PI * Math.min(Math.max(u, 0.1), 0.9)),
        0.55,
      );
      const ro = radiusAt(a) * (1.05 + between(-0.07, 0.09));
      const ri = ro - thickness * taper * between(0.85, 1.15);
      outer.push([Math.cos(a) * ro, Math.sin(a) * ro]);
      inner.push([Math.cos(a) * ri, Math.sin(a) * ri]);
    }
    shapes.push({
      points: [...outer, ...inner.reverse()].map(transform),
      fill: SPOT,
      radius: r * 1.45,
      cx,
      cy,
    });
    angle += span + (gapTotal / fragments) * between(0.6, 1.4);
  }
  return shapes;
}

function spot(cx: number, cy: number, r: number): Shape {
  return {
    points: blob(cx, cy, r, r * between(0.6, 0.95), between(0, Math.PI), 0.25),
    fill: SPOT,
    radius: r * 1.3,
    cx,
    cy,
  };
}

/** Toroidal distance so that spacing also holds across the tile edges. */
function torusDistance(a: Point, b: Point): number {
  const dx = Math.min(Math.abs(a[0] - b[0]), SIZE - Math.abs(a[0] - b[0]));
  const dy = Math.min(Math.abs(a[1] - b[1]), SIZE - Math.abs(a[1] - b[1]));
  return Math.hypot(dx, dy);
}

type Placed = { c: Point; r: number };
const placed: Placed[] = [];

function place(
  count: number,
  rMin: number,
  rMax: number,
  gap: number,
  attempts = 4000,
): Placed[] {
  const result: Placed[] = [];
  for (let i = 0; i < attempts && result.length < count; i++) {
    const c: Point = [random() * SIZE, random() * SIZE];
    const r = between(rMin, rMax);
    if (placed.every((p) => torusDistance(p.c, c) > p.r + r + gap)) {
      const item = { c, r };
      placed.push(item);
      result.push(item);
    }
  }
  return result;
}

const shapes: Shape[] = [];
for (const { c, r } of place(14, 24, 34, 7))
  shapes.push(...rosette(c[0], c[1], r));
for (const { c, r } of place(6, 13, 17, 6))
  shapes.push(...rosette(c[0], c[1], r));
for (const { c, r } of place(22, 3, 7, 4)) shapes.push(spot(c[0], c[1], r));

const paths = new Map<string, string[]>();
for (const shape of shapes) {
  for (const dx of [-SIZE, 0, SIZE]) {
    for (const dy of [-SIZE, 0, SIZE]) {
      const x = shape.cx + dx;
      const y = shape.cy + dy;
      if (x + shape.radius < 0 || x - shape.radius > SIZE) continue;
      if (y + shape.radius < 0 || y - shape.radius > SIZE) continue;
      const list = paths.get(shape.fill) ?? [];
      list.push(smoothPath(shape.points, [dx, dy]));
      paths.set(shape.fill, list);
    }
  }
}

const body = [CENTRE, SPOT]
  .map(
    (fill) => `<path fill="${fill}" d="${(paths.get(fill) ?? []).join("")}"/>`,
  )
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="${CAMEL}"/>${body}</svg>\n`;

writeFileSync("public/patterns/leopard.svg", svg);
console.log(
  `public/patterns/leopard.svg — ${(svg.length / 1024).toFixed(1)} KB, ${shapes.length} shapes`,
);
