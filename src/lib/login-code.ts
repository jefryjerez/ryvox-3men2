import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const RESEND_COOLDOWN_MS = 45 * 1000; // no reenviar antes de 45 s
const MAX_ATTEMPTS = 5;

async function sha256Hex(s: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** `true` si ya se envió un código a este correo hace menos de `RESEND_COOLDOWN_MS`. */
export async function isRateLimited(email: string): Promise<boolean> {
  const db = await getDb();
  const last = await db.query.loginCodes.findFirst({
    where: (c, { eq }) => eq(c.email, normalizeEmail(email)),
    orderBy: (c, { desc }) => desc(c.createdAt),
  });
  return !!last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS;
}

/** Genera un código de 6 dígitos, lo guarda con hash (nunca en texto plano) y lo devuelve para enviarlo por correo.
 *  Reemplaza cualquier código anterior de ese correo, así solo hay uno activo a la vez. */
export async function createLoginCode(email: string): Promise<string> {
  const db = await getDb();
  const norm = normalizeEmail(email);
  // Solo un código activo a la vez: los anteriores sin usar quedan sin efecto al pedir uno nuevo.
  await db.delete(schema.loginCodes).where(eq(schema.loginCodes.email, norm));

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  await db.insert(schema.loginCodes).values({
    id: `lc-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`,
    email: norm,
    codeHash: await sha256Hex(`${norm}:${code}`),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  return code;
}

export type CodeCheck = "ok" | "invalid" | "expired" | "too-many-attempts";

/** Verifica el código contra el más reciente sin usar y no vencido de ese correo; cuenta los intentos fallidos. */
export async function verifyLoginCode(email: string, code: string): Promise<CodeCheck> {
  const db = await getDb();
  const norm = normalizeEmail(email);
  const row = await db.query.loginCodes.findFirst({
    where: (c, { eq, and, isNull, gt }) => and(eq(c.email, norm), isNull(c.usedAt), gt(c.expiresAt, new Date())),
    orderBy: (c, { desc }) => desc(c.createdAt),
  });
  if (!row) return "expired";
  if (row.attempts >= MAX_ATTEMPTS) return "too-many-attempts";

  const hash = await sha256Hex(`${norm}:${code.trim()}`);
  if (hash !== row.codeHash) {
    await db.update(schema.loginCodes).set({ attempts: row.attempts + 1 }).where(eq(schema.loginCodes.id, row.id));
    return row.attempts + 1 >= MAX_ATTEMPTS ? "too-many-attempts" : "invalid";
  }
  await db.update(schema.loginCodes).set({ usedAt: new Date() }).where(eq(schema.loginCodes.id, row.id));
  return "ok";
}
