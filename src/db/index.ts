import "server-only";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

export type Db = DrizzleD1Database<typeof schema>;

const g = globalThis as unknown as { __ryvoxSeeded?: Promise<void> };

/**
 * Cliente de base de datos sobre Cloudflare D1.
 * En `next dev` el binding lo provee Wrangler (D1 local en .wrangler/state); en producción, el Worker.
 * Las migraciones se aplican con `npm run db:migrate:local` / `db:migrate:remote`.
 */
export async function getDb(): Promise<Db> {
  const { env } = await getCloudflareContext({ async: true });
  const d1 = (env as CloudflareEnv & { DB?: D1Database }).DB;
  if (!d1) throw new Error("Falta el binding D1 'DB' (revisa wrangler.jsonc)");
  const db = drizzle(d1, { schema });
  if (!g.__ryvoxSeeded) {
    g.__ryvoxSeeded = seedIfEmpty(db).catch((err) => {
      g.__ryvoxSeeded = undefined;
      throw err;
    });
  }
  await g.__ryvoxSeeded;
  return db;
}

export { schema };
