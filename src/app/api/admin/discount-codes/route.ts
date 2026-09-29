import { requireAdmin } from "@/lib/auth-server";
import { createDiscountCode, listDiscountCodes } from "@/lib/data";

const CODE_RE = /^[A-Z0-9-]{3,24}$/;

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  return Response.json({ codes: await listDiscountCodes() });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = (await req.json().catch(() => null)) as { code?: string; percentOff?: number; note?: string } | null;
  const code = body?.code?.trim().toUpperCase() ?? "";
  const percentOff = Math.round(Number(body?.percentOff));
  if (!CODE_RE.test(code)) return Response.json({ error: "El código debe tener 3-24 letras, números o guiones" }, { status: 400 });
  if (!Number.isFinite(percentOff) || percentOff < 1 || percentOff > 100) return Response.json({ error: "El % debe ser entre 1 y 100" }, { status: 400 });
  try {
    const created = await createDiscountCode({ code, percentOff, note: body?.note });
    return Response.json({ code: created }, { status: 201 });
  } catch (err) {
    return Response.json({ error: `Ya existe un código con ese texto: ${(err as Error).message}` }, { status: 409 });
  }
}
