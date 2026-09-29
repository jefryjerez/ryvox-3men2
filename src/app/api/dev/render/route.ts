import { writeFile } from "node:fs/promises";
import path from "node:path";

/** Solo en desarrollo: guarda un PNG exportado desde /render/<modelo> en public/products/<nombre>.png. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });
  const body = (await req.json().catch(() => null)) as { name?: string; dataUrl?: string } | null;
  if (!body?.name || !/^[a-z0-9-]+$/.test(body.name) || !body.dataUrl?.startsWith("data:image/png;base64,")) {
    return new Response("Datos inválidos", { status: 400 });
  }
  const file = path.join(process.cwd(), "public", "products", `${body.name}.png`);
  await writeFile(file, Buffer.from(body.dataUrl.slice("data:image/png;base64,".length), "base64"));
  return new Response(`guardado ${file}`);
}
