import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { Inventory } from "@/components/dashboard/Inventory";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/inventario">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.inventory };
}

export default function InventoryPage() {
  return <Inventory />;
}
