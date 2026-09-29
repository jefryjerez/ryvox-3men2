import "server-only";
import { SignJWT, importPKCS8 } from "jose";

/**
 * Envío de notificaciones push web (RFC 8291/8292) sin la librería `web-push` (depende de Node puro,
 * no funciona en Cloudflare Workers). Todo con Web Crypto, disponible tanto en el navegador como en el Worker.
 */

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const std = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(std);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function bytesToB64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function u32be(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, false);
  return b;
}

function pemFromPkcs8B64(b64std: string): string {
  const lines = b64std.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----`;
}

function vapidKeys() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const privPkcs8 = process.env.VAPID_PRIVATE_KEY_PKCS8;
  const subject = process.env.VAPID_SUBJECT || "mailto:info@ryvoxshop.com";
  if (!pub || !privPkcs8) return null;
  return { pub, privPkcs8, subject };
}

export function pushEnabled() {
  return !!vapidKeys();
}

/** Cabecera `Authorization: vapid t=<jwt>, k=<clave pública>` que exige cada envío (RFC 8292). */
async function vapidAuthHeader(endpoint: string): Promise<string> {
  const keys = vapidKeys();
  if (!keys) throw new Error("Faltan las claves VAPID");
  const aud = new URL(endpoint).origin;
  const privateKey = await importPKCS8(pemFromPkcs8B64(keys.privPkcs8), "ES256");
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256" })
    .setAudience(aud)
    .setSubject(keys.subject)
    .setExpirationTime("12h")
    .sign(privateKey);
  return `vapid t=${jwt}, k=${keys.pub}`;
}

/** Cifra el payload para una suscripción concreta (aes128gcm, RFC 8291). Devuelve el cuerpo binario a enviar. */
async function encryptPayload(sub: PushSubscriptionJSON, payload: string): Promise<Uint8Array> {
  const uaPublicRaw = b64urlToBytes(sub.keys.p256dh); // clave pública del navegador suscrito (65 bytes)
  const authSecret = b64urlToBytes(sub.keys.auth); // 16 bytes

  const uaPublicKey = await crypto.subtle.importKey("raw", uaPublicRaw as BufferSource, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ephemeral = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPublicRaw = new Uint8Array(await crypto.subtle.exportKey("raw", ephemeral.publicKey));

  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaPublicKey }, ephemeral.privateKey, 256));

  const ikmInfo = concatBytes(new TextEncoder().encode("WebPush: info"), new Uint8Array([0]), uaPublicRaw, asPublicRaw);
  const ikmKey = await crypto.subtle.importKey("raw", sharedSecret as BufferSource, "HKDF", false, ["deriveBits"]);
  const ikm = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: authSecret as BufferSource, info: ikmInfo as BufferSource }, ikmKey, 256));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derivedKey = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  const cekInfo = concatBytes(new TextEncoder().encode("Content-Encoding: aes128gcm"), new Uint8Array([0]));
  const nonceInfo = concatBytes(new TextEncoder().encode("Content-Encoding: nonce"), new Uint8Array([0]));
  const cek = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: cekInfo as BufferSource }, derivedKey, 128));
  const nonce = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: nonceInfo as BufferSource }, derivedKey, 96));

  const aesKey = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["encrypt"]);
  const plaintext = concatBytes(new TextEncoder().encode(payload), new Uint8Array([2])); // octeto de relleno mínimo (un solo registro)
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce as BufferSource }, aesKey, plaintext as BufferSource));

  const header = concatBytes(salt, u32be(4096), new Uint8Array([asPublicRaw.length]), asPublicRaw);
  return concatBytes(header, ciphertext);
}

export type PushResult = "sent" | "gone" | "error";

/** Envía una notificación push cifrada a una suscripción. `"gone"` indica que ya no es válida y debe borrarse. */
export async function sendWebPush(sub: PushSubscriptionJSON, payload: Record<string, unknown>): Promise<PushResult> {
  if (!vapidKeys()) {
    console.log("[push simulado]", sub.endpoint.slice(0, 60), JSON.stringify(payload));
    return "sent";
  }
  try {
    const body = await encryptPayload(sub, JSON.stringify(payload));
    const auth = await vapidAuthHeader(sub.endpoint);
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        "content-encoding": "aes128gcm",
        ttl: "14400",
        urgency: "high",
        authorization: auth,
      },
      body: body as BodyInit,
    });
    if (res.status === 404 || res.status === 410) return "gone";
    if (!res.ok) {
      console.error("[push]", res.status, await res.text().catch(() => ""));
      return "error";
    }
    return "sent";
  } catch (err) {
    console.error("[push]", err);
    return "error";
  }
}

export { bytesToB64url };
