"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Community, SiteSettings } from "@/lib/types";
import { cx, initials } from "@/lib/utils";
import { Icon } from "./Icon";
import { Reveal } from "./motion";

/** Yerli şəkil → next/image (optimallaşdırılmış), xarici və data: → adi img. */
export function Img({ src, alt, className, sizes, priority, fill, width, height }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean; fill?: boolean; width?: number; height?: number }) {
  if (!src) return null;
  const local = src.startsWith("/") && !src.startsWith("/api/");
  if (local || src.startsWith("https://firebasestorage.googleapis.com")) {
    return fill ? (
      <Image src={src} alt={alt} fill sizes={sizes ?? "100vw"} className={className} priority={priority} />
    ) : (
      <Image src={src} alt={alt} width={width ?? 400} height={height ?? 400} sizes={sizes} className={className} priority={priority} />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cx(fill && "absolute inset-0 h-full w-full", className)} loading={priority ? "eager" : "lazy"} decoding="async" width={width} height={height} />;
}

/** Nömrəli bölmə başlığı: "02 / HAQQIMIZDA". */
export function SectionHead({ n, label, title, lead, right, className }: { n?: number; label: string; title?: React.ReactNode; lead?: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cx("mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between", className)}>
      <Reveal className="max-w-3xl">
        <div className="eyebrow mb-5 flex items-center gap-3">
          <span className="h-px w-10 bg-accent-text/70" aria-hidden="true" />
          {n !== undefined && <span>{String(n).padStart(2, "0")} /</span>}
          <span className="eyebrow-accent">{label}</span>
        </div>
        {title && <h2 className="h-section">{title}</h2>}
        {lead && <p className="lead mt-5 max-w-2xl">{lead}</p>}
      </Reveal>
      {right && <Reveal delay={0.1}>{right}</Reveal>}
    </div>
  );
}

type Logoish = Pick<Community, "name" | "logo" | "accent"> | (Pick<SiteSettings, "logo" | "accent"> & { name: string });

/** İcma loqosu. Loqo yoxdursa baş hərflərlə zövqlü yer tutucu. Ağ fonlu loqo ağ kartda göstərilir. */
export function LogoMark({ c, size = 44, className, theme = "dark", rounded = 14 }: { c: Logoish; size?: number; className?: string; theme?: "dark" | "light"; rounded?: number }) {
  const url = theme === "light" ? c.logo.light || c.logo.dark : c.logo.dark || c.logo.light;
  if (!url) {
    return (
      <span
        className={cx("relative inline-grid shrink-0 place-items-center overflow-hidden font-display font-bold text-white", className)}
        style={{
          width: size, height: size, borderRadius: rounded, fontSize: size * 0.36, letterSpacing: "-0.04em",
          background: `radial-gradient(120% 120% at 0% 0%, color-mix(in oklab, ${c.accent} 100%, white 25%), ${c.accent} 45%, color-mix(in oklab, ${c.accent} 55%, black))`,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,.18), 0 8px 24px -10px ${c.accent}`,
        }}
        role="img"
        aria-label={c.name}
      >
        <span aria-hidden="true" className="absolute inset-0 opacity-30" style={{ background: "repeating-linear-gradient(135deg, rgba(255,255,255,.18) 0 1px, transparent 1px 7px)" }} />
        <span aria-hidden="true" className="relative">{initials(c.name.replace(/([a-z])([A-Z])/g, "$1 $2"))}</span>
      </span>
    );
  }
  const pad = c.logo.card ? Math.round(size * 0.06) : 0;
  return (
    <span className={cx("relative inline-block shrink-0 overflow-hidden", c.logo.card && "logo-card", className)} style={{ width: size, height: size, borderRadius: rounded, padding: pad }}>
      <span className="relative block h-full w-full">
        <Img src={url} alt={c.name} fill sizes={`${size * 2}px`} className="object-contain" />
      </span>
    </span>
  );
}

export function Avatar({ name, photo, size = 56, accent, className }: { name: string; photo?: string; size?: number; accent?: string; className?: string }) {
  if (photo)
    return (
      <span className={cx("relative inline-block shrink-0 overflow-hidden rounded-2xl bg-surface2", className)} style={{ width: size, height: size }}>
        <Img src={photo} alt={name} fill sizes={`${size * 2}px`} className="object-cover" />
      </span>
    );
  return (
    <span
      className={cx("inline-grid shrink-0 place-items-center rounded-2xl font-display font-semibold", className)}
      style={{ width: size, height: size, fontSize: size * 0.34, color: "var(--accent-text)", background: `color-mix(in oklab, ${accent ?? "var(--accent)"} 16%, transparent)`, border: `1px solid color-mix(in oklab, ${accent ?? "var(--accent)"} 35%, transparent)` }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Soon({ title, text, className }: { title: string; text?: string; className?: string }) {
  return (
    <div className={cx("card flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-line2 text-accent-text">
        <Icon name="sparkle" size={20} />
      </span>
      <p className="font-display text-xl font-semibold">{title}</p>
      {text && <p className="max-w-md text-sm text-muted">{text}</p>}
    </div>
  );
}

export function Accordion({ items, defaultOpen = -1 }: { items: { q: string; a: string }[]; defaultOpen?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface backdrop-blur">
      {items.map((it, i) => {
        const on = open === i;
        return (
          <div key={i}>
            <h3>
              <button
                className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-surface2 md:px-7"
                aria-expanded={on}
                aria-controls={`${id}-${i}`}
                onClick={() => setOpen(on ? -1 : i)}
              >
                <span className="font-mono text-xs text-accent-text">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-display text-base font-semibold md:text-lg">{it.q}</span>
                <span className={cx("grid h-8 w-8 place-items-center rounded-full border border-line2 transition-transform duration-300", on && "rotate-45 border-accent-text text-accent-text")}>
                  <Icon name="plus" size={16} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div
                  id={`${id}-${i}`}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-6 pl-14 text-muted md:px-7 md:pl-[4.25rem]">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>("button, a[href], input, textarea, select, [tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0]!, last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    setTimeout(() => ref.current?.querySelector<HTMLElement>("input, textarea, select, button")?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cx("relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[24px] border border-line2 bg-surface-solid p-6 shadow-2xl sm:rounded-[24px] md:p-8", wide ? "sm:max-w-4xl" : "sm:max-w-lg")}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="font-display text-xl font-semibold md:text-2xl">{title}</h2>
              <button className="icon-btn shrink-0" onClick={onClose} aria-label="Bağla">
                <Icon name="close" size={16} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

let toastFn: ((msg: string, kind?: "ok" | "err") => void) | null = null;
export const toast = (msg: string, kind: "ok" | "err" = "ok") => toastFn?.(msg, kind);
export function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string; kind: "ok" | "err" }[]>([]);
  useEffect(() => {
    toastFn = (msg, kind = "ok") => {
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, msg, kind }]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3800);
    };
    return () => {
      toastFn = null;
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
            className={cx("pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur", t.kind === "ok" ? "border-ok/40 bg-surface-solid text-fg" : "border-danger/50 bg-surface-solid text-danger")}>
            <Icon name={t.kind === "ok" ? "check" : "close"} size={16} />
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function SocialIcon({ kind }: { kind: string }) {
  return <Icon name={kind === "email" ? "mail" : kind} size={18} />;
}
