import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { OrderDetail } from "@/components/dashboard/OrderDetail";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/ordenes/[id]">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.orders };
}

export default async function OrderPage({ params }: PageProps<"/[lang]/dashboard/ordenes/[id]">) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}
