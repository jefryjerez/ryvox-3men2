import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { ProductEditor } from "@/components/dashboard/ProductEditor";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/productos/[id]">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.products };
}

export default async function ProductEditPage({ params }: PageProps<"/[lang]/dashboard/productos/[id]">) {
  const { id } = await params;
  return <ProductEditor id={id} />;
}
