"use client";
import Link from "next/link";
import { useSite } from "./SiteProvider";
import { SiteMark } from "./Chrome";
import { Icon } from "@/components/ui/Icon";
import { LogoMark, SocialIcon } from "@/components/ui/bits";
import { COMMUNITY_IDS, type Links } from "@/lib/types";
import { href, mailto, tl } from "@/lib/utils";

const SOCIALS: (keyof Links)[] = ["whatsapp", "instagram", "tiktok", "linkedin", "telegram", "email"];
const LABEL: Record<keyof Links, string> = { whatsapp: "WhatsApp", instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn", telegram: "Telegram", email: "E-poçt" };

export function SocialLinks({ links, className = "" }: { links: Links; className?: string }) {
  const items = SOCIALS.filter((k) => links[k]?.trim());
  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((k) => (
        <li key={k}>
          <a
            className="icon-btn"
            href={k === "email" ? mailto(links[k]) : links[k]}
            target={k === "email" ? undefined : "_blank"}
            rel="noopener noreferrer"
            aria-label={LABEL[k]}
            title={LABEL[k]}
          >
            <SocialIcon kind={k} />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  const { content, lang, t } = useSite();
  const pages = [
    ["about", `${href(lang, "/")}#about`], ["events", href(lang, "/events")], ["problemBank", href(lang, "/problem-bank")], ["team", href(lang, "/team")],
    ["partners", href(lang, "/partners")], ["faq", href(lang, "/faq")], ["contact", href(lang, "/contact")], ["collab", `${href(lang, "/")}#collab`],
  ] as const;
  return (
    <footer className="relative mt-10 border-t border-line">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href={href(lang, "/")} className="inline-flex items-center gap-3 font-display text-lg font-semibold">
            <SiteMark size={40} /> {tl(content.site.name, lang)}
          </Link>
          <p className="mt-4 max-w-sm text-sm text-muted">{t("universityName")}</p>
          <SocialLinks links={content.site.links} className="mt-6" />
        </div>
        <nav aria-label={t("pages")}>
          <p className="eyebrow mb-4">{t("pages")}</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm md:grid-cols-1">
            {pages.map(([k, to]) => (
              <li key={k}>
                <Link href={to} className="text-muted transition-colors hover:text-fg">{t(k)}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="eyebrow mb-4">{t("communities")}</p>
          <ul className="space-y-3">
            {COMMUNITY_IDS.map((id) => {
              const c = content.communities[id];
              return (
                <li key={id}>
                  <Link href={href(lang, `/${id}`)} className="group flex items-center gap-3">
                    <LogoMark c={c} size={30} rounded={9} />
                    <span className="text-sm">
                      <span className="block font-medium transition-colors group-hover:text-accent-text">{c.name}</span>
                      <span className="block text-xs text-faint">{tl(c.field, lang)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-start justify-between gap-4 py-6 text-xs text-faint sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {tl(content.site.name, lang)}. {t("rights")}</p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-fg">{t("admin")}</Link>
            <button
              className="inline-flex items-center gap-1.5 hover:text-fg"
              onClick={() => (window.__lenis ? window.__lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" }))}
            >
              {t("toTop")} <Icon name="arrowUp" size={14} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
