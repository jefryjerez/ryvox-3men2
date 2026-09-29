"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { InstagramIcon, TikTokIcon } from "@/components/brand/SocialIcons";
import { LanguageSwitch } from "@/components/brand/LanguageSwitch";
import { useT } from "@/i18n/client";

export function Footer() {
  const { t } = useT();
  return (
    <footer id="contacto" className="bg-black text-white">
      <div className="container-x mx-auto max-w-[1400px] py-16 md:py-24">
        <p className="eyebrow text-white/50">{t.footer.contact}</p>
        <h2 className="display mt-4 text-[clamp(2.6rem,9vw,7.5rem)] uppercase">
          {t.footer.title1}
          <br />
          {t.footer.title2}
        </h2>

        <div className="mt-14 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo variant="white" width={150} href="/" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">{t.footer.text}</p>
          </div>
          <div>
            <p className="eyebrow text-white/50">{t.footer.write}</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="mailto:info@ryvoxshop.com" className="inline-flex items-center gap-2 text-white/80 hover:text-white">
                  <Mail size={16} /> info@ryvoxshop.com
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-white/50">{t.footer.social}</p>
            <ul className="mt-4 flex items-center gap-3">
              <li>
                <a href="https://instagram.com/ryvoxshop" target="_blank" rel="noopener" aria-label="Instagram @ryvoxshop" title="Instagram" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white hover:text-white">
                  <InstagramIcon width={20} height={20} />
                </a>
              </li>
              <li>
                <a href="https://www.tiktok.com/@ryvoxshop" target="_blank" rel="noopener" aria-label="TikTok @ryvoxshop" title="TikTok" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white hover:text-white">
                  <TikTokIcon width={20} height={20} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} RYVOX. {t.footer.rights}</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/productos" className="hover:text-white">
              {t.footer.catalog}
            </Link>
            <Link href="/terminos" className="hover:text-white">
              {t.legal.terms}
            </Link>
            <Link href="/reembolsos" className="hover:text-white">
              {t.legal.refunds}
            </Link>
            <Link href="/privacidad" className="hover:text-white">
              {t.legal.privacy}
            </Link>
            <LanguageSwitch tone="light" />
          </div>
        </div>
      </div>
    </footer>
  );
}
