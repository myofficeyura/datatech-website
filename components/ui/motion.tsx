"use client";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

const ease = [0.2, 0.8, 0.2, 1] as const;

/** Scroll ilə yumşaq görünmə. */
export function Reveal({ children, className, delay = 0, y = 24, as = "div" }: { children: React.ReactNode; className?: string; delay?: number; y?: number; as?: "div" | "li" | "section" | "article" }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </M>
  );
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } };

export function Stagger({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M className={className} variants={container} initial={reduce ? false : "hidden"} whileInView="show" viewport={{ once: true, margin: "0px 0px -8% 0px" }}>
      {children}
    </M>
  );
}
export function StaggerItem({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "li" | "article" }) {
  const M = motion[as];
  return (
    <M className={className} variants={item}>
      {children}
    </M>
  );
}

/** Görünəndə 0-dan sayan rəqəm. */
export function CountUp({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) return setV(to);
    const c = animate(0, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, to, reduce]);
  return (
    <span ref={ref} className={className} aria-label={`${to}${suffix}`}>
      <span aria-hidden="true">
        {v.toLocaleString("az")}
        {suffix}
      </span>
    </span>
  );
}

/** Masaüstündə yüngül 3D əyilmə və kursorun ardınca işıltı. */
export function Tilt({ children, className, max = 6, ...rest }: { children: React.ReactNode; className?: string; max?: number } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(false);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 200, damping: 20 });
  // 3D transform yalnız kursor üstündə olanda (və geri qayıdana qədər) tətbiq olunur: sükunətdə element düz qalır.
  const [active, setActive] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches), []);
  useEffect(() => () => clearTimeout(idle.current), []);
  const on = fine && !reduce;
  return (
    <motion.div
      ref={ref}
      className={cx("card-glow", className)}
      style={on && active ? { rotateX: rx, rotateY: ry, transformPerspective: 900 } : undefined}
      onPointerEnter={() => {
        clearTimeout(idle.current);
        if (on) setActive(true);
      }}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        ref.current!.style.setProperty("--mx", `${x * 100}%`);
        ref.current!.style.setProperty("--my", `${y * 100}%`);
        if (on) {
          mx.set(x);
          my.set(y);
        }
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
        idle.current = setTimeout(() => setActive(false), 700);
      }}
      {...(rest as object)}
    >
      {children}
    </motion.div>
  );
}

/** Kursora azca yaxınlaşan (maqnit) element. */
export function Magnetic({ children, strength = 0.25 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, { stiffness: 250, damping: 18 });
  const y = useSpring(0, { stiffness: 250, damping: 18 });
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(false);
  useEffect(() => setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches), []);
  if (!fine || reduce) return <>{children}</>;
  return (
    <motion.span
      ref={ref}
      style={{ x, y, display: "inline-flex" }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

export function Marquee({ items, className, speed = 40 }: { items: string[]; className?: string; speed?: number }) {
  if (!items.length) return null;
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((k, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 font-display text-2xl font-semibold tracking-tight text-fg/80 md:text-4xl">{k}</span>
          <span className="text-accent-text" aria-hidden="true">✦</span>
        </span>
      ))}
    </div>
  );
  // Qısa siyahını ekranı dolduracaq qədər təkrarla.
  const reps = Math.max(2, Math.ceil(12 / items.length));
  return (
    <div className={cx("marquee py-6", className)} style={{ ["--marquee-dur" as string]: `${speed}s` }}>
      <div className="marquee-track" tabIndex={0} aria-label={items.join(", ")}>
        {Array.from({ length: reps * 2 }, (_, i) => (
          <span key={i}>{row(i > 0)}</span>
        ))}
      </div>
    </div>
  );
}
