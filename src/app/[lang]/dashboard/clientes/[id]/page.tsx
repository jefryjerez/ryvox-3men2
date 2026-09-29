import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { CustomerDetail } from "@/components/dashboard/Customers";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/clientes/[id]">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.customers };
}

export default async function CustomerPage({ params }: PageProps<"/[lang]/dashboard/clientes/[id]">) {
  const { id } = await params;
  return <CustomerDetail id={id} />;
}
