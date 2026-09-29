import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { ProductsAdmin } from "@/components/dashboard/ProductsAdmin";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/productos">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.products };
}

export default function ProductsAdminPage() {
  return <ProductsAdmin />;
}
