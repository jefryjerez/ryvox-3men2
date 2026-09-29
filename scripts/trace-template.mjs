// Prepara la plantilla real a partir de su arte (PNG/JPG sobre fondo blanco o transparente):
//  1. public/products/plantilla-hairline-art.png  → textura del modelo 3D (arte recortado, fondo transparente, 2048 px)
//  2. src/components/three/template-outline.json  → contorno de la silueta (coordenadas 0..1) para extruir el acrílico
//  3. public/products/plantilla-hairline-negro.webp → foto de catálogo: el arte a todo detalle sobre el fondo de estudio
// Uso: node scripts/trace-template.mjs "C:/ruta/al/arte.png"
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const src = process.argv[2];
if (!src) throw new Error("uso: node scripts/trace-template.mjs <arte.png>");

// --- 1. recorte: la plantilla es lo opaco (fondo transparente) o, si no hay alfa, lo que no sea blanco ---
const base = sharp(src).ensureAlpha();
const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const meta = await sharp(src).metadata();
const isInk = meta.hasAlpha
  ? (x, y) => data[(y * W + x) * C + 3] > 8
  : (x, y) => { const i = (y * W + x) * C; return data[i] < 235 || data[i + 1] < 235 || data[i + 2] < 235; };

// caja del contenido
let minX = W, maxX = 0, minY = H, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isInk(x, y)) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const bw = maxX - minX + 1, bh = maxY - minY + 1;

// máscara: relleno vertical por columna (la silueta es convexa en vertical), así los blancos interiores no se pierden
const alpha = Buffer.alloc(bw * bh);
for (let x = 0; x < bw; x++) {
  let t = -1, b = -1;
  for (let y = 0; y < bh; y++) if (isInk(x + minX, y + minY)) { if (t < 0) t = y; b = y; }
  if (t >= 0) for (let y = t; y <= b; y++) alpha[y * bw + x] = 255;
}
// la máscara debe ir en el canal alfa (RGBA) para que "dest-in" la use como transparencia
const rgba = Buffer.alloc(bw * bh * 4);
for (let i = 0; i < bw * bh; i++) rgba[i * 4 + 3] = alpha[i];
const alphaImg = await sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }).png().toBuffer();

const cutout = await sharp(src).extract({ left: minX, top: minY, width: bw, height: bh }).flatten({ background: "#000000" }).ensureAlpha().composite([{ input: alphaImg, blend: "dest-in" }]).png().toBuffer();
await sharp(cutout).resize({ width: 2048, withoutEnlargement: false }).png({ compressionLevel: 9 }).toFile("public/products/plantilla-hairline-art.png");

// --- 2. contorno: por columna, primer y último píxel de tinta (la silueta es convexa en vertical) ---
const step = Math.max(1, Math.round(bw / 400));
const top = [], bottom = [];
for (let x = 0; x < bw; x += step) {
  let t = -1, b = -1;
  for (let y = 0; y < bh; y++) if (alpha[y * bw + x] > 0) { if (t < 0) t = y; b = y; }
  if (t >= 0) { top.push([x, t]); bottom.push([x, b]); }
}
const poly = [...top, ...bottom.reverse()];
// simplificación Ramer-Douglas-Peucker
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = 0, dmax = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const d = Math.abs((b[1] - a[1]) * x - (b[0] - a[0]) * y + b[0] * a[1] - b[1] * a[0]) / Math.hypot(b[1] - a[1], b[0] - a[0]);
    if (d > dmax) { idx = i; dmax = d; }
  }
  if (dmax > eps) return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
  return [a, b];
}
const simplified = rdp(poly, bw * 0.0008).map(([x, y]) => [+(x / bw).toFixed(4), +(1 - y / bh).toFixed(4)]);
writeFileSync("src/components/three/template-outline.json", JSON.stringify({ aspect: +(bw / bh).toFixed(4), points: simplified }));

// --- 3. foto de catálogo: arte completo sobre el fondo de estudio con sombra suave ---
const S = 1200;
const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs><radialGradient id="g" cx="50%" cy="42%" r="70%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#ececec"/></radialGradient></defs><rect width="${S}" height="${S}" fill="url(#g)"/></svg>`);
const art = await sharp(cutout).resize({ width: Math.round(S * 0.82), height: Math.round(S * 0.82), fit: "inside" }).png().toBuffer();
const am = await sharp(art).metadata();
const shadow = await sharp({ create: { width: am.width, height: am.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.28 } } }).composite([{ input: art, blend: "dest-in" }]).png().toBuffer();
const shadowBlur = await sharp(shadow).blur(16).png().toBuffer();
const left = Math.round((S - am.width) / 2), topY = Math.round((S - am.height) / 2);
await sharp(bg).composite([{ input: shadowBlur, left: left + 14, top: topY + 26 }, { input: art, left, top: topY }]).webp({ quality: 88 }).toFile("public/products/plantilla-hairline-negro.webp");

console.log(`ok: arte ${bw}x${bh}, contorno ${simplified.length} puntos, aspecto ${(bw / bh).toFixed(3)}`);
