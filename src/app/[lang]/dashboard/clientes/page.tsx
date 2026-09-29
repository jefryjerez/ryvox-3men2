import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { CustomersList } from "@/components/dashboard/Customers";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/clientes">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.customers };
}

export default function CustomersPage() {
  return <CustomersList />;
}
