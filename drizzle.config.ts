import { defineConfig } from "drizzle-kit";

/**
 * Genera migraciones SQL para Cloudflare D1 (SQLite) en ./migrations:
 *   npm run db:generate
 * Wrangler las aplica: npm run db:migrate:local / db:migrate:remote
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});
