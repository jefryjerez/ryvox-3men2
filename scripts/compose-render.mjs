// Monta un PNG transparente exportado desde /render/<modelo> sobre el fondo de estudio del catálogo
// y lo guarda como public/products/<nombre>.webp (1200 px). Uso: node scripts/compose-render.mjs <nombre> [escala]
import sharp from "sharp";
import { unlink } from "node:fs/promises";

const [name, scaleArg] = process.argv.slice(2);
if (!name) throw new Error("uso: node scripts/compose-render.mjs <nombre> [escala]");
const S = 1200;
const scale = Number(scaleArg ?? 1.15);

const bg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs><radialGradient id="g" cx="50%" cy="42%" r="70%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#ececec"/></radialGradient></defs><rect width="${S}" height="${S}" fill="url(#g)"/></svg>`,
);

const src = `public/products/${name}.png`;
// recorta al contenido y lo reescala para que ocupe el encuadre de forma consistente entre productos
const trimmed = await sharp(src).trim({ threshold: 8 }).png().toBuffer();
const meta = await sharp(trimmed).metadata();
const target = Math.round(S * 0.62 * scale);
const fit = await sharp(trimmed).resize({ width: target, height: target, fit: "inside", withoutEnlargement: false }).png().toBuffer();
const m2 = await sharp(fit).metadata();

await sharp(bg)
  .composite([{ input: fit, left: Math.round((S - m2.width) / 2), top: Math.round((S - m2.height) / 2 + S * 0.03) }])
  .webp({ quality: 84 })
  .toFile(`public/products/${name}.webp`);
await unlink(src);
console.log("ok", name, `${meta.width}x${meta.height} -> ${m2.width}x${m2.height}`);
