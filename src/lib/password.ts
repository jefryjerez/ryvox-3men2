/* Hash de contraseñas con PBKDF2 (Web Crypto): funciona igual en Node y en Cloudflare Workers. */

const ITERATIONS = 100_000; // máximo que permite Cloudflare Workers
const KEYLEN = 32;

function toHex(buf: ArrayBuffer | Uint8Array) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, key, KEYLEN * 8);
}

/** Formato: pbkdf2:iteraciones:salt:hash (hex). Solo se usa para poblar la columna password_hash
 *  (NOT NULL) al crear el admin inicial en el seed; el login real ya es sin contraseña (ver login-code.ts). */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derive(password, salt, ITERATIONS);
  return `pbkdf2:${ITERATIONS}:${toHex(salt)}:${toHex(bits)}`;
}
