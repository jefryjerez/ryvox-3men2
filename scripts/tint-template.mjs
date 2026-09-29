// Variantes de color de la plantilla a partir del arte recortado (public/products/plantilla-hairline-art.png):
//  - textura del 3D por color:  public/products/plantilla-hairline-art-<color>.png  (el arte "screen" sobre el color base)
//  - foto de catálogo por color: public/products/plantilla-hairline-<color>.webp
// El negro no se toca: usa el arte original. Uso: node scripts/tint-template.mjs
import sharp from "sharp";

const COLORS = { azul: "#1f4fd6", verde: "#2bcf3c", rosado: "#ff5fa2", rojo: "#d92027", dorado: "#d4af37" };
const S = 1200;
const art = "public/products/plantilla-hairline-art.png";
const meta = await sharp(art).metadata();
const alpha = await sharp(art).extractChannel("alpha").toBuffer();

const bg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs><radialGradient id="g" cx="50%" cy="42%" r="70%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#ececec"/></radialGradient></defs><rect width="${S}" height="${S}" fill="url(#g)"/></svg>`,
);

for (const [color, hex] of Object.entries(COLORS)) {
  // arte sobre el color base: lo negro pasa a ser el color, lo blanco (logo, escalas) sigue blanco
  const tinted = await sharp({ create: { width: meta.width, height: meta.height, channels: 4, background: hex } })
    .composite([{ input: await sharp(art).removeAlpha().toBuffer(), blend: "screen" }])
    .png()
    .toBuffer();
  const cutout = await sharp(tinted).removeAlpha().joinChannel(alpha).png().toBuffer();
  await sharp(cutout).png({ compressionLevel: 9 }).toFile(`public/products/plantilla-hairline-art-${color}.png`);

  // foto de catálogo: mismo encuadre y sombra que la versión negra
  const photo = await sharp(cutout).resize({ width: Math.round(S * 0.82), height: Math.round(S * 0.82), fit: "inside" }).png().toBuffer();
  const pm = await sharp(photo).metadata();
  const shadow = await sharp({ create: { width: pm.width, height: pm.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.28 } } }).composite([{ input: photo, blend: "dest-in" }]).png().toBuffer();
  const shadowBlur = await sharp(shadow).blur(16).png().toBuffer();
  const left = Math.round((S - pm.width) / 2), top = Math.round((S - pm.height) / 2);
  await sharp(bg).composite([{ input: shadowBlur, left: left + 14, top: top + 26 }, { input: photo, left, top }]).webp({ quality: 88 }).toFile(`public/products/plantilla-hairline-${color}.webp`);
  console.log("ok", color);
}
