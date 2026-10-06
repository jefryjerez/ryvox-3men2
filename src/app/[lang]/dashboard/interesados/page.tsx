import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { Interested } from "@/components/dashboard/Interested";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/interesados">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.interested };
}

export default function InterestedPage() {
  return <Interested />;
}
