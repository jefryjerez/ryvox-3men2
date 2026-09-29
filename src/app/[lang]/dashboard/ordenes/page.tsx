import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { OrdersList } from "@/components/dashboard/OrdersList";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/ordenes">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.orders };
}

export default function OrdersPage() {
  return <OrdersList />;
}
