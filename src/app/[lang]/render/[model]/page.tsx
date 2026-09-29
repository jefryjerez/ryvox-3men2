import { notFound } from "next/navigation";
import { RenderStage } from "@/components/three/RenderStage";
import { isColorId } from "@/lib/colors";
import type { Model3D } from "@/lib/products";

const MODELS: Exclude<Model3D, null>[] = ["template", "airbrush-mount", "dispenser"];

/**
 * Solo en desarrollo: escenario fijo para exportar la foto de un modelo 3D (fondo transparente).
 * Uso: abrir /render/<modelo>?color=<color> y ejecutar window.__ryvoxExport("nombre") desde la consola.
 */
export default async function RenderPage({ params, searchParams }: { params: Promise<{ lang: string; model: string }>; searchParams: Promise<{ color?: string }> }) {
  const { model } = await params;
  const { color } = await searchParams;
  if (process.env.NODE_ENV !== "development" || !MODELS.includes(model as Exclude<Model3D, null>)) notFound();
  return <RenderStage model={model as Exclude<Model3D, null>} color={isColorId(color) ? color : "negro"} />;
}
