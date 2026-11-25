"use client";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type Lenis from "lenis";
import { useSite } from "./SiteProvider";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/ui/bits";
import { Magnetic } from "@/components/ui/motion";
import { COMMUNITY_IDS, isCommunityId, type CommunityId, type Lang } from "@/lib/types";
import { cx, href, onColor, tl } from "@/lib/utils";
import { t as tr } from "@/lib/i18n";

declare global {
  interface Window { __lenis?: Lenis }
}

/** Cari icma (URL-in birinci seqmenti). */
export function useCurrentCommunity(): CommunityId | null {
  const segs = useSelectedLayoutSegments();
  return isCommunityId(segs[0]) ? segs[0] : null;
}

/** Aksent rəngi: icma səhifəsində icmanın, digər səhifələrdə ortaq saytın rəngi. CSS @property ilə animasiyalı keçid. */
export function AccentStyle() {
  const { content } = useSite();
  const cid = useCurrentCommunity();
  const a = cid ? content.communities[cid].accent : content.site.accent;
  return <style>{`:root{--accent:${a};--on-accent:${onColor(a)}}`}</style>;
}

function useScrolled(y = 8) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => setS(window.scrollY > y);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [y]);
  return s;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useSite();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => setTheme((document.documentElement.dataset.theme as "dark" | "light") || "dark"), []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  };
  return (
    <button className={cx("icon-btn", className)} onClick={toggle} aria-label={t("theme")} title={t("theme")}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.25 }} className="grid">
          <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function LangSwitch({ className }: { className?: string }) {
  const { lang } = useSite();
  const segs = useSelectedLayoutSegments();
  const path = "/" + segs.filter((s) => !s.startsWith("(") && !s.startsWith("__")).join("/");
  return (
    <div className={cx("flex items-center gap-1 font-mono text-xs", className)} role="group" aria-label={tr(lang, "lang")}>
      {(["az", "en"] as Lang[]).map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-faint" aria-hidden="true">|</span>}
          <a
            href={href(l, path === "/" ? "/" : path)}
            hrefLang={l}
            lang={l}
            aria-current={lang === l ? "true" : undefined}
            className={cx("rounded px-1.5 py-1 uppercase tracking-widest transition-colors", lang === l ? "text-accent-text" : "text-faint hover:text-fg")}
          >
            {l}
          </a>
        </span>
      ))}
    </div>
  );
}

function CommunitySwitcher({ compact }: { compact?: boolean }) {
  const { content, lang, t } = useSite();
  const cur = useCurrentCommunity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => setOpen(false), [cur]);
  const c = cur ? content.communities[cur] : null;
  return (
    <div ref={ref} className="relative">
      <button
        className="flex h-10 items-center gap-2 rounded-full border border-line2 bg-surface2 pl-1.5 pr-3 text-sm font-medium transition-colors hover:border-accent-text/60"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("selectCommunity")}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="grid h-7 w-7 place-items-center">
          {c ? <LogoMark c={c} size={26} rounded={8} /> : (
            <span className="grid grid-cols-2 gap-[3px]" aria-hidden="true">
              {COMMUNITY_IDS.map((id) => <span key={id} className="h-[9px] w-[9px] rounded-[3px]" style={{ background: content.communities[id].accent }} />)}
            </span>
          )}
        </span>
        <span className={cx("max-w-[9rem] truncate", compact && "max-w-[6.5rem]")}>{c ? c.name : t("allCommunities")}</span>
        <Icon name="chevron" size={14} className={cx("transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={t("communities")}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={cx("absolute z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-line2 bg-surface-solid p-1.5 shadow-2xl", compact ? "right-0" : "left-0")}
          >
            <li role="option" aria-selected={!c}>
              <Link href={href(lang, "/")} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-surface2">
                <span className="grid h-8 w-8 grid-cols-2 place-content-center gap-[3px] rounded-lg bg-surface2 p-1.5" aria-hidden="true">
                  {COMMUNITY_IDS.map((id) => <span key={id} className="h-full w-full rounded-[3px]" style={{ background: content.communities[id].accent }} />)}
                </span>
                <span className="flex-1 font-medium">{t("allCommunities")}</span>
                {!c && <Icon name="check" size={16} className="text-accent-text" />}
              </Link>
            </li>
            {COMMUNITY_IDS.map((id) => {
              const x = content.communities[id];
              return (
                <li key={id} role="option" aria-selected={cur === id}>
                  <Link href={href(lang, `/${id}`)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-surface2">
                    <LogoMark c={x} size={32} rounded={9} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{x.name}</span>
                      <span className="block truncate text-xs text-faint">{tl(x.field, lang)}</span>
                    </span>
                    <span className="dot" style={{ background: x.accent }} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function useNav() {
  const { lang } = useSite();
  const cur = useCurrentCommunity();
  const base = cur ? `/${cur}` : "/";
  return {
    main: [
      { k: "about" as const, to: `${href(lang, base)}#about` },
      { k: "events" as const, to: href(lang, "/events") },
      { k: "problemBank" as const, to: href(lang, "/problem-bank") },
      { k: "team" as const, to: href(lang, "/team") },
    ],
    more: [
      { k: "partners" as const, to: href(lang, "/partners") },
      { k: "faq" as const, to: href(lang, "/faq") },
      { k: "contact" as const, to: href(lang, "/contact") },
      { k: "collab" as const, to: `${href(lang, "/")}#collab` },
    ],
    join: `${href(lang, base)}#join`,
  };
}

function MoreMenu() {
  const { t } = useSite();
  const nav = useNav();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative" onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-fg" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} onMouseEnter={() => setOpen(true)}>
        {t("more")} <Icon name="chevron" size={14} className={cx("transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }} className="absolute right-0 top-full z-50 pt-2">
            <div className="w-56 rounded-2xl border border-line2 bg-surface-solid p-1.5 shadow-2xl">
              {nav.more.map((m) => (
                <Link key={m.k} role="menuitem" href={m.to} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-surface2" onClick={() => setOpen(false)}>
                  {t(m.k)}
                  <Icon name="chevronRight" size={14} className="text-faint" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { content, lang, t } = useSite();
  const nav = useNav();
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    window.__lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.__lenis?.start();
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  const links = [...nav.main, ...nav.more];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t("menu")}
          className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-bg/95 backdrop-blur-xl"
          initial={reduce ? { opacity: 0 } : { clipPath: "circle(0% at calc(100% - 40px) 36px)" }}
          animate={reduce ? { opacity: 1 } : { clipPath: "circle(150% at calc(100% - 40px) 36px)" }}
          exit={reduce ? { opacity: 0 } : { clipPath: "circle(0% at calc(100% - 40px) 36px)" }}
          transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
        >
          <div className="aurora" aria-hidden="true" />
          <div className="container-x relative flex h-[72px] items-center justify-between">
            <Link href={href(lang, "/")} onClick={onClose} className="flex items-center gap-2.5 font-display font-semibold">
              <SiteMark size={34} /> {tl(content.site.name, lang)}
            </Link>
            <button className="icon-btn" onClick={onClose} aria-label={t("close")}>
              <Icon name="close" size={18} />
            </button>
          </div>
          <nav className="container-x relative flex-1 pb-10 pt-4" aria-label={t("menu")}>
            <ul className="flex flex-col">
              {links.map((m, i) => (
                <motion.li key={m.k} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.045, duration: 0.45 }}>
                  <Link href={m.to} onClick={onClose} className="group flex items-baseline gap-4 border-b border-line py-3.5">
                    <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-3xl font-semibold tracking-tight transition-colors group-hover:text-accent-text">{t(m.k)}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <motion.div className="mt-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <p className="eyebrow mb-3">{t("communities")}</p>
              <div className="grid grid-cols-2 gap-2">
                {COMMUNITY_IDS.map((id) => {
                  const c = content.communities[id];
                  return (
                    <Link key={id} href={href(lang, `/${id}`)} onClick={onClose} className="card flex items-center gap-3 p-3">
                      <LogoMark c={c} size={34} rounded={10} />
                      <span className="text-sm font-semibold">{c.name}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <LangSwitch />
                <ThemeToggle />
                <Link href={nav.join} onClick={onClose} className="btn btn-primary">
                  {t("join")} <Icon name="arrow" size={16} className="arrow" />
                </Link>
              </div>
            </motion.div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SiteMark({ size = 36 }: { size?: number }) {
  const { content } = useSite();
  const s = content.site;
  if (s.logo.dark || s.logo.light) return <LogoMark c={{ name: s.name.az, logo: s.logo, accent: s.accent }} size={size} rounded={10} />;
  return (
    <span className="grid shrink-0 grid-cols-2 gap-[3px] rounded-[11px] border border-line2 bg-surface2 p-[6px]" style={{ width: size, height: size }} aria-hidden="true">
      {COMMUNITY_IDS.map((id) => <span key={id} className="rounded-[4px]" style={{ background: content.communities[id].accent }} />)}
    </span>
  );
}

export function Header() {
  const { content, lang, t } = useSite();
  const nav = useNav();
  const scrolled = useScrolled();
  const [menu, setMenu] = useState(false);
  const segs = useSelectedLayoutSegments();
  useEffect(() => setMenu(false), [segs.join("/")]);
  return (
    <>
      <header className={cx("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "border-b border-line bg-bg/70 backdrop-blur-xl" : "border-b border-transparent")}>
        <div className="container-x flex h-[72px] items-center gap-3">
          <Link href={href(lang, "/")} className="mr-1 flex items-center gap-2.5 font-display text-[1.05rem] font-semibold tracking-tight" aria-label={tl(content.site.name, lang)}>
            <SiteMark />
            <span className="hidden sm:inline">{tl(content.site.name, lang)}</span>
          </Link>
          <div className="hidden md:block">
            <CommunitySwitcher />
          </div>
          <nav className="ml-auto hidden items-center gap-0.5 xl:flex" aria-label="Əsas">
            {nav.main.map((m) => (
              <Link key={m.k} href={m.to} className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-fg">
                {t(m.k)}
              </Link>
            ))}
            <MoreMenu />
          </nav>
          <div className="ml-auto flex items-center gap-2 xl:ml-3">
            <LangSwitch className="hidden sm:flex" />
            <ThemeToggle className="hidden sm:inline-grid" />
            <div className="md:hidden">
              <CommunitySwitcher compact />
            </div>
            <Magnetic>
              <Link href={nav.join} className="btn btn-primary btn-sm hidden sm:inline-flex">
                {t("join")}
              </Link>
            </Magnetic>
            <button className="icon-btn xl:hidden" onClick={() => setMenu(true)} aria-label={t("openMenu")} aria-expanded={menu} aria-controls="mobile-menu">
              <Icon name="menu" size={18} />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
    </>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
  return <motion.div className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent" style={{ scaleX }} aria-hidden="true" />;
}

export function BackToTop() {
  const { t } = useSite();
  const show = useScrolled(700);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          className="icon-btn fixed bottom-5 right-5 z-40 h-12 w-12 bg-surface-solid shadow-lg"
          onClick={() => (window.__lenis ? window.__lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" }))}
          aria-label={t("toTop")}
          title={t("toTop")}
        >
          <Icon name="arrowUp" size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/** Lenis: yalnız masaüstündə və "azaldılmış hərəkət" söndürülübsə. */
export function SmoothScroll() {
  const segs = useSelectedLayoutSegments();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let lenis: Lenis | null = null;
    import("lenis").then(({ default: L }) => {
      lenis = new L({ duration: 1.1, smoothWheel: true, anchors: { offset: -80 } });
      window.__lenis = lenis;
      const loop = (t: number) => {
        lenis!.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      window.__lenis = undefined;
    };
  }, []);
  const key = segs.join("/");
  useEffect(() => {
    if (!location.hash) window.__lenis?.scrollTo(0, { immediate: true });
  }, [key]);
  return null;
}

export function SkipLink() {
  const { t } = useSite();
  return (
    <a href="#main" className="sr-only z-[100] rounded-full bg-accent px-4 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
      {t("skip")}
    </a>
  );
}
