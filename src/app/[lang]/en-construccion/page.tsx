import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { InstagramIcon, TikTokIcon } from "@/components/brand/SocialIcons";
import { LanguageSwitch } from "@/components/brand/LanguageSwitch";
import { dict } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/en-construccion">): Promise<Metadata> {
  const { lang } = await params;
  return { title: { absolute: dict(lang).t.meta.soon }, robots: { index: false, follow: false } };
}

export default async function UnderConstructionPage({ params }: PageProps<"/[lang]/en-construccion">) {
  const { lang } = await params;
  const { t } = dict(lang);
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <header className="container-x relative mx-auto flex w-full max-w-[1400px] items-center justify-between py-8">
        <Logo variant="white" width={140} href="/" priority />
        <LanguageSwitch tone="light" />
      </header>

      <main className="container-x relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center py-16">
        <p className="eyebrow text-white/50">{t.construction.eyebrow}</p>
        <h1 className="display mt-6 text-[clamp(3rem,12vw,10rem)] uppercase leading-[0.92]">
          {t.construction.title1}
          <br />
          {t.construction.title2}
        </h1>
        <p className="mt-8 max-w-md text-base leading-relaxed text-white/60 md:text-lg">{t.construction.text}</p>
      </main>

      <footer className="container-x relative mx-auto flex w-full max-w-[1400px] flex-col gap-4 border-t border-white/10 py-8 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
        <a href="mailto:info@ryvoxshop.com" className="hover:text-white">
          info@ryvoxshop.com
        </a>
        <span className="flex items-center gap-3">
          <a href="https://instagram.com/ryvoxshop" target="_blank" rel="noopener" aria-label="Instagram @ryvoxshop" title="Instagram" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-white hover:text-white">
            <InstagramIcon width={18} height={18} />
          </a>
          <a href="https://www.tiktok.com/@ryvoxshop" target="_blank" rel="noopener" aria-label="TikTok @ryvoxshop" title="TikTok" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-white hover:text-white">
            <TikTokIcon width={18} height={18} />
          </a>
        </span>
        <span>© {new Date().getFullYear()} RYVOX · Build to evolve</span>
      </footer>
    </div>
  );
}
