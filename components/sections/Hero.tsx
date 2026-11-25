"use client";
import Link from "next/link";
import { NetworkCanvas } from "./NetworkCanvas";
import { useSite } from "@/components/site/SiteProvider";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/ui/bits";
import { Magnetic, Tilt } from "@/components/ui/motion";
import { COMMUNITY_IDS, type Community, type Hero as HeroT } from "@/lib/types";
import { cx, href, tl } from "@/lib/utils";

/** Başlıq sözləri bir-bir görünür (CSS animasiyası: hidratasiyanı gözləmədən, LCP üçün sürətli). */
function Words({ text, highlight, base = 0.15 }: { text: string; highlight: number; base?: number }) {
  const lines = text.split("\n").filter((x) => x.trim());
  let i = 0;
  return (
    <>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((w, wi) => {
            const d = base + i++ * 0.07;
            return (
              <span key={wi} className={cx("word", li === highlight && "text-gradient word-grad")} style={{ animationDelay: `${d}s` }}>
                {w}
                {wi < line.split(" ").length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

/** Uzun başlıqlar (məs. icma adı + sahə + universitet) üçün şrift kiçilir ki, sətirlər çox qırılmasın. */
function titleSize(title: string) {
  const longest = Math.max(0, ...title.split("\n").map((l) => l.trim().length));
  if (longest <= 16) return "text-[clamp(2.5rem,7vw,5.6rem)]";
  if (longest <= 28) return "text-[clamp(2.25rem,5.6vw,4.5rem)]";
  return "text-[clamp(2.1rem,4.6vw,3.9rem)]";
}

export function Hero({ hero, community, primary, secondary, highlight = 0 }: {
  hero: HeroT;
  community?: Community;
  primary: { label: string; to: string; external?: boolean };
  secondary: { label: string; to: string };
  highlight?: number;
}) {
  const { content, lang } = useSite();
  const title = tl(hero.title, lang);
  const badges = hero.badges.filter((b) => tl(b, lang));
  const sub = tl(hero.subtitle, lang);
  return (
    <section id="top" className="noise relative flex min-h-[100svh] items-center overflow-hidden pb-16 pt-28 md:pt-32">
      <div className="aurora" aria-hidden="true" />
      <div className="bg-grid absolute inset-0" aria-hidden="true" />
      <NetworkCanvas className="opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" aria-hidden="true" />

      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1.35fr_1fr]">
        <div>
          {community ? (
            <p className="fade-up eyebrow mb-6 flex items-center gap-3" style={{ animationDelay: "0.05s" }}>
              <span className="dot" style={{ background: community.accent }} aria-hidden="true" />
              <span className="eyebrow-accent">{community.name}</span>
              <span aria-hidden="true">·</span>
              <span>{tl(community.field, lang)}</span>
            </p>
          ) : (
            <p className="fade-up eyebrow mb-6 flex items-center gap-3" style={{ animationDelay: "0.05s" }}>
              <span className="h-px w-8 bg-accent-text/70" aria-hidden="true" />
              <span className="eyebrow-accent">{tl(content.site.name, lang)}</span>
            </p>
          )}

          <h1 className={cx("h-display", titleSize(title))}>
            <Words text={title} highlight={highlight} />
          </h1>

          {sub && (
            <p className="fade-up lead mt-7 max-w-2xl" style={{ animationDelay: "0.55s" }}>
              {sub}
            </p>
          )}

          <div className="fade-up mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.7s" }}>
            <Magnetic>
              {primary.external ? (
                <a href={primary.to} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  {primary.label} <Icon name="arrow" size={16} className="arrow" />
                  <span className="sr-only">{lang === "az" ? "(yeni pəncərədə açılır)" : "(opens in a new tab)"}</span>
                </a>
              ) : (
                <Link href={primary.to} className="btn btn-primary">
                  {primary.label} <Icon name="arrow" size={16} className="arrow" />
                </Link>
              )}
            </Magnetic>
            <Link href={secondary.to} className="btn btn-ghost">
              {secondary.label}
            </Link>
          </div>

          {badges.length > 0 && (
            <ul className="fade-up mt-12 flex flex-wrap gap-2.5" style={{ animationDelay: "0.85s" }}>
              {badges.slice(0, 3).map((b, i) => (
                <li key={i} className="tag gap-2 py-1.5 pl-1.5 pr-3">
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-[0.65rem] font-semibold text-on-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {tl(b, lang)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="fade-up relative hidden lg:block" style={{ animationDelay: "0.4s" }}>
          {community ? (
            <Tilt className="card mx-auto grid aspect-square w-full max-w-[380px] place-items-center rounded-[32px] p-10" max={8}>
              <div className="absolute inset-6 rounded-[24px] border border-dashed border-line2" aria-hidden="true" />
              <LogoMark c={community} size={230} rounded={28} />
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">{community.name}</span>
            </Tilt>
          ) : (
            <div className="mx-auto grid max-w-[440px] grid-cols-2 gap-4">
              {COMMUNITY_IDS.map((id, i) => {
                const c = content.communities[id];
                return (
                  <Link key={id} href={href(lang, `/${id}`)} className={cx("block", i % 2 === 1 && "translate-y-8")} style={{ ["--accent" as string]: c.accent }}>
                    <Tilt className="card card-hover flex aspect-square flex-col justify-between rounded-[26px] p-5">
                      <LogoMark c={c} size={64} rounded={16} />
                      <div>
                        <p className="font-display text-lg font-semibold">{c.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted">{tl(c.field, lang)}</p>
                      </div>
                    </Tilt>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <a href="#content-start" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-faint transition-colors hover:text-fg md:flex" aria-label={lang === "az" ? "Aşağı sürüşdür" : "Scroll down"}>
        <span className="h-10 w-6 rounded-full border border-line2 p-1">
          <span className="block h-2 w-full animate-bounce rounded-full bg-accent-text" />
        </span>
      </a>
    </section>
  );
}
