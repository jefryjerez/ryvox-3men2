import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { Team } from "@/components/dashboard/Team";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/equipo">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.team };
}

export default function TeamPage() {
  return <Team />;
}
