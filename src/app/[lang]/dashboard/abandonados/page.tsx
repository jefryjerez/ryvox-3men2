import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { AbandonedList } from "@/components/dashboard/AbandonedList";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/abandonados">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.abandoned };
}

export default function AbandonedPage() {
  return <AbandonedList />;
}
