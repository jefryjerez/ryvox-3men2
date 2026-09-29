import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

/* Caché de páginas ISR en KV (no requiere activar R2). */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
