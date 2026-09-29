import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitch } from "@/components/brand/LanguageSwitch";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { dict } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/login">): Promise<Metadata> {
  const { lang } = await params;
  return { title: dict(lang).t.meta.login, robots: { index: false } };
}

export default async function LoginPage({ params }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  const { t } = dict(lang);
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-mist px-5 py-12">
      <Logo width={140} href="/" />
      <div className="mt-10 w-full max-w-sm rounded-3xl border border-line bg-white p-7">
        <h1 className="display text-2xl">{t.login.title}</h1>
        <p className="mt-1 text-sm text-black/55">{t.login.text}</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <div className="mt-8">
        <LanguageSwitch />
      </div>
      <p className="eyebrow mt-6 text-black/35">Build to evolve</p>
    </div>
  );
}
