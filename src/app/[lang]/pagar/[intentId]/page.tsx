import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { PosPayForm } from "@/components/store/PosPayForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; intentId: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.pay.title, robots: { index: false, follow: false } };
}

export default async function PayPage({ params }: { params: Promise<{ lang: string; intentId: string }> }) {
  const { intentId } = await params;
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-mist px-5 py-12">
      <div className="w-full max-w-sm">
        <PosPayForm intentId={intentId} />
      </div>
    </div>
  );
}
