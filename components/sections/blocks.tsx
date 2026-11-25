"use client";
import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSite } from "@/components/site/SiteProvider";
import { Icon } from "@/components/ui/Icon";
import { Avatar, Img, LogoMark, SectionHead, Soon } from "@/components/ui/bits";
import { CountUp, Marquee, Reveal, Stagger, StaggerItem, Tilt } from "@/components/ui/motion";
import { COMMUNITY_IDS, type Community, type CommunityId, type EventDoc, type Mentor, type Partner, type Person } from "@/lib/types";
import { cx, fmtDate, hasL, href, isPast, monthName, tl, WEEKDAYS } from "@/lib/utils";

const accentVar = (c: string) => ({ ["--accent" as string]: c }) as React.CSSProperties;

// ─────────────────────────── İcma kartları ───────────────────────────
export function CommunitiesGrid({ n }: { n?: number }) {
  const { content, lang, t } = useSite();
  return (
    <section id="communities" className="section">
      <div className="container-x">
        <SectionHead n={n} label={t("communities")} title={t("communitiesTitle")} lead={t("communitiesLead")} />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COMMUNITY_IDS.map((id) => {
            const c = content.communities[id];
            return (
              <StaggerItem key={id}>
                <Link href={href(lang, `/${id}`)} className="group block h-full" style={accentVar(c.accent)}>
                  <Tilt className="card card-hover flex h-full flex-col overflow-hidden p-6">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" aria-hidden="true" />
                    <div className="flex items-start justify-between">
                      <LogoMark c={c} size={64} rounded={16} />
                      <span className="dot mt-2" style={{ background: c.accent, boxShadow: `0 0 16px ${c.accent}` }} aria-hidden="true" />
                    </div>
                    <h3 className="mt-8 font-display text-2xl font-semibold">{c.name}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted">{tl(c.field, lang)}</p>
                    <div className="mt-8 flex items-center justify-between border-t border-line pt-4">
                      {c.stats.members > 0 ? (
                        <span className="text-sm">
                          <b className="font-display text-lg">{c.stats.members}</b> <span className="text-faint">{t("members")}</span>
                        </span>
                      ) : <span />}
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text">
                        {t("enter")} <Icon name="arrow" size={15} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Tilt>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

// ─────────────────────────── Statistika ───────────────────────────
export function StatsRow({ items }: { items: { label: string; value: number; suffix?: string }[] }) {
  const shown = items.filter((x) => x.value > 0);
  if (!shown.length) return null;
  return (
    <div className="container-x">
      <Reveal className={cx("card grid divide-line overflow-hidden", shown.length > 1 && "sm:divide-x", shown.length === 2 ? "sm:grid-cols-2" : shown.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4")}>
        {shown.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 border-b border-line px-6 py-7 last:border-b-0 sm:border-b-0 md:px-8">
            <CountUp to={s.value} suffix={s.suffix} className="font-display text-4xl font-semibold tracking-tight md:text-5xl" />
            <span className="text-sm text-muted">{s.label}</span>
          </div>
        ))}
      </Reveal>
    </div>
  );
}

// ─────────────────────────── Haqqımızda ───────────────────────────
export function AboutCommunity({ c, n }: { c: Community; n?: number }) {
  const { lang, t } = useSite();
  const a = c.about;
  const has = hasL(a.title) || hasL(a.text);
  return (
    <section id="about" className="section">
      <div className="container-x">
        <SectionHead n={n} label={t("about")} />
        {!has ? (
          <Soon title={t("soon")} text={t("soonText")} />
        ) : (
          <>
            <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
              <Reveal>
                <h2 className="h-section">{tl(a.title, lang) || c.name}</h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="lead">{tl(a.text, lang)}</p>
              </Reveal>
            </div>

            {a.compare.length > 0 && (
              <Reveal className="mt-14 grid gap-4 md:grid-cols-2">
                <div className="px-2 md:px-6">
                  <p className="eyebrow mb-4">{t("compareOld")}</p>
                  <ul>
                    {a.compare.map((r, i) => (
                      <li key={i} className="flex min-h-[3.5rem] items-center border-b border-line py-3 text-muted">
                        <span className="strike">{tl(r.old, lang)}</span>
                        <span className="sr-only"> {t("compareOldNote")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card px-5 py-4 md:px-6" style={{ boxShadow: "0 30px 80px -40px var(--glow)" }}>
                  <p className="eyebrow eyebrow-accent mb-4">{c.name}</p>
                  <ul>
                    {a.compare.map((r, i) => (
                      <motion.li key={i} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.08 }}
                        className="flex min-h-[3.5rem] items-center gap-3 border-b border-line py-3 font-medium last:border-b-0">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-text"><Icon name="check" size={14} /></span>
                        {tl(r.now, lang)}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

            {a.values.length > 0 && (
              <Stagger className="mt-14 grid gap-4 md:grid-cols-3">
                {a.values.map((v, i) => (
                  <StaggerItem key={i}>
                    <Tilt className="card card-hover h-full p-7">
                      <span className="font-mono text-sm text-accent-text">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="mt-6 font-display text-xl font-semibold">{tl(v.title, lang)}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{tl(v.text, lang)}</p>
                    </Tilt>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </>
        )}
      </div>
      {a.keywords.length > 0 && <Marquee items={a.keywords} className="mt-16 border-y border-line" />}
    </section>
  );
}

export function AboutShared({ n }: { n?: number }) {
  const { content, lang, t } = useSite();
  const a = content.site.about;
  if (!hasL(a.title) && !hasL(a.text)) return null;
  return (
    <section id="about" className="section">
      <div className="container-x">
        <SectionHead n={n} label={t("about")} />
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <Reveal><h2 className="h-section">{tl(a.title, lang)}</h2></Reveal>
          <Reveal delay={0.1}><p className="lead">{tl(a.text, lang)}</p></Reveal>
        </div>
      </div>
      {a.keywords.length > 0 && <Marquee items={a.keywords} className="mt-16 border-y border-line" />}
    </section>
  );
}

// ─────────────────────────── Nə edirik (stepper) ───────────────────────────
export function WorkStepper({ c, n }: { c: Community; n?: number }) {
  const { lang, t } = useSite();
  const w = c.work;
  const steps = w.steps;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px -20% 0px" });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView || paused || reduce || steps.length < 2) return;
    const id = setTimeout(() => setI((x) => (x + 1) % steps.length), 4200);
    return () => clearTimeout(id);
  }, [i, inView, paused, reduce, steps.length]);
  const has = steps.length > 0 || hasL(w.title);
  const cur = steps[i];
  return (
    <section id="what" className="section">
      <div className="container-x">
        <SectionHead
          n={n}
          label={t("whatWeDo")}
          title={(has && tl(w.title, lang)) || t("whatWeDo")}
          lead={has ? tl(w.intro, lang) : undefined}
          right={steps.length > 1 ? (
            <p className="font-mono text-sm text-faint" aria-live="polite">
              <span className="text-accent-text">{String(i + 1).padStart(2, "0")}</span> / {String(steps.length).padStart(2, "0")}
            </p>
          ) : undefined}
        />
        {!has ? (
          <Soon title={t("soon")} text={t("soonText")} />
        ) : (
          <>
            {steps.length > 0 && (
              <div ref={ref} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
                <div className="relative">
                  <div className="absolute left-0 right-0 top-[22px] h-px bg-line2" aria-hidden="true" />
                  <motion.div className="absolute left-0 top-[22px] h-px bg-accent" animate={{ width: steps.length > 1 ? `${(i / (steps.length - 1)) * 100}%` : "100%" }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }} aria-hidden="true" />
                  <ol className="relative flex justify-between" role="tablist" aria-label={tl(w.title, lang)}>
                    {steps.map((s, k) => (
                      <li key={k} className="flex flex-col items-center">
                        <button
                          role="tab"
                          aria-selected={k === i}
                          aria-controls="work-panel"
                          onClick={() => setI(k)}
                          className={cx(
                            "relative grid h-11 w-11 place-items-center rounded-full border font-mono text-xs transition-all duration-500",
                            k === i ? "scale-110 border-accent bg-accent text-on-accent shadow-[0_0_30px_-4px_var(--glow)]" : k < i ? "border-accent/60 bg-bg text-accent-text" : "border-line2 bg-bg text-faint hover:border-accent/50",
                          )}
                        >
                          {String(k + 1).padStart(2, "0")}
                          <span className="sr-only">{tl(s.title, lang)}</span>
                        </button>
                        <span className={cx("mt-3 hidden max-w-[9rem] text-center text-sm font-medium transition-colors md:block", k === i ? "text-fg" : "text-faint")}>{tl(s.title, lang)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div id="work-panel" role="tabpanel" className="card relative mt-10 min-h-[220px] overflow-hidden p-7 md:p-10">
                  {!paused && !reduce && steps.length > 1 && inView && (
                    <motion.div key={i} className="absolute inset-x-0 top-0 h-[2px] origin-left bg-accent/70" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 4.2, ease: "linear" }} aria-hidden="true" />
                  )}
                  <AnimatePresence mode="wait">
                    {cur && (
                      <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-12">
                        <span className="font-display text-6xl font-semibold leading-none text-accent-text/90 md:text-8xl">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <h3 className="font-display text-2xl font-semibold md:text-3xl">{tl(cur.title, lang)}</h3>
                          <p className="lead mt-3 max-w-2xl">{tl(cur.text, lang)}</p>
                          {hasL(cur.result) && (
                            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-xs text-accent-text">
                              <Icon name="arrow" size={14} /> {t("result")}: {tl(cur.result, lang)}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
            {w.daily.length > 0 && (
              <div className="mt-16">
                <Reveal><h3 className="mb-6 font-display text-2xl font-semibold">{t("dailyWork")}</h3></Reveal>
                <Stagger as="ul" className="grid gap-3 md:grid-cols-2">
                  {w.daily.map((d, k) => (
                    <StaggerItem as="li" key={k} className="card card-hover flex gap-4 p-5">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/12 text-accent-text"><Icon name="check" size={15} /></span>
                      <div>
                        <p className="font-semibold">{tl(d.title, lang)}</p>
                        <p className="mt-1 text-sm text-muted">{tl(d.text, lang)}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────── Rollar və qoşulma ───────────────────────────
export function RolesBlock({ c, n }: { c: Community; n?: number }) {
  const { lang, t } = useSite();
  const r = c.roles;
  if (!r.items.length && !r.join.length) return null;
  return (
    <section id="roles" className="section">
      <div className="container-x">
        <SectionHead n={n} label={r.items.length ? t("roles") : t("howToJoin")} title={tl(r.title, lang) || (r.items.length ? t("roles") : t("howToJoin"))} lead={tl(r.intro, lang) || undefined} />
        {r.items.length > 0 && (
          <Stagger className="grid gap-4 md:grid-cols-3">
            {r.items.map((it, i) => (
              <StaggerItem key={i}>
                <Tilt className="card card-hover h-full overflow-hidden p-7">
                  <span className="absolute -right-6 -top-10 font-display text-[9rem] font-bold leading-none text-accent/[0.07]" aria-hidden="true">{i + 1}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/12 text-accent-text"><Icon name={["edit", "palette", "chart"][i % 3]!} size={20} /></span>
                  <h3 className="mt-8 font-display text-2xl font-semibold">{tl(it.title, lang)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{tl(it.text, lang)}</p>
                </Tilt>
              </StaggerItem>
            ))}
          </Stagger>
        )}
        {r.join.length > 0 && (
          <div className={cx(r.items.length > 0 && "mt-16")}>
            {r.items.length > 0 && <Reveal><h3 className="mb-6 font-display text-2xl font-semibold">{t("howToJoin")}</h3></Reveal>}
            <Stagger as="ol" className="grid gap-4 md:grid-cols-3">
              {r.join.map((s, i) => (
                <StaggerItem as="li" key={i} className="card relative p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-accent/50 font-display font-semibold text-accent-text">{i + 1}</span>
                  <p className="mt-5 font-display text-lg font-semibold">{tl(s.title, lang)}</p>
                  <p className="mt-2 text-sm text-muted">{tl(s.text, lang)}</p>
                  {i < r.join.length - 1 && <Icon name="arrow" size={18} className="absolute right-5 top-8 hidden text-faint md:block" />}
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────── Tədbirlər ───────────────────────────
export function EventCard({ e }: { e: EventDoc }) {
  const { content, lang, t } = useSite();
  const host = content.communities[e.community];
  const all = [e.community, ...e.with.filter((x) => x !== e.community)];
  const joint = all.length > 1;
  return (
    <Link href={href(lang, `/events/${e.slug}`)} className="group block h-full" style={accentVar(host?.accent ?? content.site.accent)}>
      <Tilt className="card card-hover flex h-full flex-col overflow-hidden" max={4}>
        <div className="relative aspect-[16/10] overflow-hidden bg-surface2">
          {e.cover ? (
            <Img src={e.cover} alt="" fill sizes="(min-width:1024px) 400px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ background: `radial-gradient(80% 80% at 30% 20%, color-mix(in oklab, ${host?.accent} 35%, transparent), transparent)` }}>
              <Icon name="calendar" size={40} className="text-accent-text/70" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" aria-hidden="true" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {hasL(e.type) && <span className="tag border-white/25 bg-black/60 text-white backdrop-blur">{tl(e.type, lang)}</span>}
            {joint && <span className="tag border-white/25 bg-black/60 text-white backdrop-blur">{t("joint")}</span>}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="font-mono text-xs text-faint">{fmtDate(e.date, lang)}{e.time ? ` · ${e.time}` : ""}</p>
          <h3 className="mt-2 font-display text-xl font-semibold leading-snug">{tl(e.title, lang)}</h3>
          {hasL(e.summary) && <p className="mt-2 line-clamp-3 text-sm text-muted">{tl(e.summary, lang)}</p>}
          <div className="mt-auto flex items-center justify-between gap-3 pt-6">
            <div className="flex -space-x-2">
              {all.map((id) => content.communities[id] && <LogoMark key={id} c={content.communities[id]} size={28} rounded={8} className="ring-2 ring-bg" />)}
            </div>
            <span className="flex items-center gap-3 text-sm">
              {e.participants && <span className="text-faint">{e.participants} {t("participants")}</span>}
              <span className="inline-flex items-center gap-1 font-semibold text-accent-text">{t("details")} <Icon name="arrow" size={14} className="transition-transform group-hover:translate-x-1" /></span>
            </span>
          </div>
        </div>
      </Tilt>
    </Link>
  );
}

export function EventsBlock({ events, n, title, lead, showAll = true, id = "events", bare = false }: { events: EventDoc[]; n?: number; title?: string; lead?: string; showAll?: boolean; id?: string; bare?: boolean }) {
  const { lang, t } = useSite();
  const upcoming = events.filter((e) => !isPast(e.date)).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((e) => isPast(e.date));
  return (
    <section id={id} className={cx("section", bare && "pt-4 md:pt-6")}>
      <div className="container-x">
        {!bare && (
          <SectionHead n={n} label={t("events")} title={title ?? t("events")} lead={lead}
            right={showAll ? <Link href={href(lang, "/events")} className="btn btn-ghost btn-sm">{t("allEvents")} <Icon name="arrow" size={14} className="arrow" /></Link> : undefined} />
        )}
        {!events.length ? (
          <Soon title={t("soon")} text={t("noUpcoming")} />
        ) : (
          <div className="space-y-12">
            <div>
              <p className="eyebrow mb-5">{t("upcoming")}</p>
              {upcoming.length > 0 ? (
                <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((e) => <StaggerItem key={e.id}><EventCard e={e} /></StaggerItem>)}
                </Stagger>
              ) : (
                <p className="card flex items-center gap-3 px-5 py-4 text-sm text-muted"><Icon name="calendar" size={16} className="shrink-0 text-accent-text" /> {t("noUpcoming")}</p>
              )}
            </div>
            {past.length > 0 && (
              <div>
                <p className="eyebrow mb-5">{t("past")}</p>
                <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {past.map((e) => <StaggerItem key={e.id}><EventCard e={e} /></StaggerItem>)}
                </Stagger>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Ortaq tədbir təqvimi: ay görünüşü, icma rəngləri ilə nöqtələr. */
export function EventCalendar({ events }: { events: EventDoc[] }) {
  const { content, lang, t } = useSite();
  const initial = useMemo(() => {
    const up = events.filter((e) => !isPast(e.date)).sort((a, b) => a.date.localeCompare(b.date))[0];
    const d = up ? new Date(up.date + "T00:00:00") : events[0] ? new Date(events[0].date + "T00:00:00") : new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  }, [events]);
  const [ym, setYm] = useState(initial);
  const [sel, setSel] = useState<string | null>(null);
  const first = new Date(ym.y, ym.m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const key = (d: number) => `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const byDay = useMemo(() => {
    const m = new Map<string, EventDoc[]>();
    for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [events]);
  const monthEvents = events.filter((e) => e.date.startsWith(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}`)).sort((a, b) => a.date.localeCompare(b.date));
  const list = sel ? byDay.get(sel) ?? [] : monthEvents;
  const go = (dm: number) => {
    setSel(null);
    setYm(({ y, m }) => {
      const d = new Date(y, m + dm, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === ym.y && today.getMonth() === ym.m && today.getDate() === d;
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <Reveal className="card p-5 md:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold" aria-live="polite">{monthName(ym.m, lang)} {ym.y}</h3>
          <div className="flex gap-2">
            <button className="icon-btn" onClick={() => go(-1)} aria-label={t("prevMonth")}><Icon name="chevronLeft" size={16} /></button>
            <button className="icon-btn" onClick={() => go(1)} aria-label={t("nextMonth")}><Icon name="chevronRight" size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center" role="grid">
          {WEEKDAYS[lang].map((w) => <div key={w} className="pb-2 font-mono text-[0.68rem] uppercase text-faint" role="columnheader">{w}</div>)}
          {Array.from({ length: startDow }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = i + 1;
            const k = key(d);
            const evs = byDay.get(k) ?? [];
            const on = sel === k;
            return (
              <button
                key={d}
                role="gridcell"
                aria-selected={on}
                aria-label={`${d} ${monthName(ym.m, lang)}${evs.length ? `: ${evs.map((e) => tl(e.title, lang)).join(", ")}` : ""}`}
                disabled={!evs.length}
                onClick={() => setSel(on ? null : k)}
                className={cx(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors",
                  evs.length ? "cursor-pointer font-semibold hover:bg-accent/15" : "text-faint",
                  on && "bg-accent text-on-accent hover:bg-accent",
                  isToday(d) && !on && "ring-1 ring-accent-text/60",
                )}
              >
                {d}
                {evs.length > 0 && (
                  <span className="absolute bottom-1.5 flex gap-0.5">
                    {[...new Set(evs.flatMap((e) => [e.community, ...e.with]))].slice(0, 4).map((c) => (
                      <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: content.communities[c as CommunityId]?.accent }} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
          {COMMUNITY_IDS.map((id) => (
            <span key={id} className="flex items-center gap-1.5 text-xs text-muted">
              <span className="dot" style={{ background: content.communities[id].accent }} /> {content.communities[id].name}
            </span>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.1} className="card p-5 md:p-7">
        <p className="eyebrow mb-4">{sel ? fmtDate(sel, lang) : t("eventsThisMonth")}</p>
        {list.length ? (
          <ul className="space-y-3">
            {list.map((e) => (
              <li key={e.id}>
                <Link href={href(lang, `/events/${e.slug}`)} className="group flex gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-accent/50">
                  <span className="grid w-12 shrink-0 place-items-center rounded-xl bg-surface2 py-2 text-center">
                    <span className="font-display text-xl font-semibold leading-none">{Number(e.date.slice(8, 10))}</span>
                    <span className="mt-1 font-mono text-[0.6rem] uppercase text-faint">{monthName(Number(e.date.slice(5, 7)) - 1, lang).slice(0, 3)}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold group-hover:text-accent-text">{tl(e.title, lang)}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-faint">
                      {[e.community, ...e.with].map((c) => <span key={c} className="flex items-center gap-1"><span className="dot" style={{ background: content.communities[c]?.accent }} />{content.communities[c]?.name}</span>)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{sel ? t("noEventsDay") : t("noUpcoming")}</p>
        )}
      </Reveal>
    </div>
  );
}

// ─────────────────────────── Komanda ───────────────────────────
export function TeamGrid({ people, accent }: { people: Person[]; accent?: string }) {
  const { lang, t } = useSite();
  const lead = people.find((p) => p.lead);
  const rest = people.filter((p) => p !== lead);
  return (
    <div className="space-y-5">
      {lead && (
        <Reveal>
          <Tilt className="card grid gap-6 overflow-hidden p-6 md:grid-cols-[auto_1fr] md:items-center md:gap-10 md:p-8" max={3}>
            <Avatar name={lead.name} photo={lead.photo} size={140} accent={accent} className="rounded-[24px]" />
            <div>
              <span className="tag tag-accent">{t("lead")}</span>
              <h3 className="mt-4 font-display text-3xl font-semibold">{lead.name}</h3>
              <p className="mt-1 text-accent-text">{tl(lead.role, lang)}</p>
              {hasL(lead.bio) && <p className="mt-4 max-w-2xl text-muted">{tl(lead.bio, lang)}</p>}
              {lead.linkedin && <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="icon-btn mt-4" aria-label={`${lead.name} LinkedIn`}><Icon name="linkedin" size={16} /></a>}
            </div>
          </Tilt>
        </Reveal>
      )}
      {rest.length > 0 && (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <StaggerItem key={p.id}>
              <Tilt className="card card-hover flex h-full gap-4 p-5">
                <Avatar name={p.name} photo={p.photo} size={64} accent={accent} />
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  <p className="text-sm text-accent-text">{tl(p.role, lang)}</p>
                  {hasL(p.bio) && <p className="mt-2 text-sm text-muted">{tl(p.bio, lang)}</p>}
                  {p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-faint hover:text-fg" aria-label={`${p.name} LinkedIn`}><Icon name="linkedin" size={16} /></a>}
                </div>
              </Tilt>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

export function TeamBlock({ c, n }: { c: Community; n?: number }) {
  const { content, t } = useSite();
  const people = content.team.filter((p) => p.community === c.id);
  return (
    <section id="team" className="section">
      <div className="container-x">
        <SectionHead n={n} label={t("team")} title={t("ourTeam")} />
        {people.length ? <TeamGrid people={people} accent={c.accent} /> : <Soon title={t("soon")} text={t("soonText")} />}
      </div>
    </section>
  );
}

export function MentorsGrid({ mentors }: { mentors: Mentor[] }) {
  const { lang } = useSite();
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {mentors.map((m) => (
        <StaggerItem key={m.id}>
          <Tilt className="card card-hover flex h-full flex-col items-start gap-4 p-6">
            <Avatar name={m.name} photo={m.photo} size={72} />
            <div>
              <h3 className="font-display text-lg font-semibold">{m.name}</h3>
              <p className="text-sm text-muted">{tl(m.field, lang)}</p>
            </div>
            {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="mt-auto text-faint hover:text-fg" aria-label={`${m.name} LinkedIn`}><Icon name="linkedin" size={16} /></a>}
          </Tilt>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function MentorsBlock({ c, n }: { c: Community; n?: number }) {
  const { content, t } = useSite();
  const list = content.mentors.filter((m) => m.community === c.id);
  if (!list.length) return null;
  return (
    <section id="mentors" className="section">
      <div className="container-x">
        <SectionHead n={n} label={t("mentors")} title={t("ourMentors")} lead={t("mentorsLead")} />
        <MentorsGrid mentors={list} />
      </div>
    </section>
  );
}

// ─────────────────────────── Tərəfdaşlar ───────────────────────────
export function PartnersGrid({ partners }: { partners: Partner[] }) {
  const { lang } = useSite();
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {partners.map((p) => {
        const inner = (
          <Tilt className="card card-hover flex h-full items-center gap-5 p-6">
            {p.logo ? (
              <span className="logo-card relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden p-2"><span className="relative h-full w-full"><Img src={p.logo} alt={p.name} fill sizes="128px" className="object-contain" /></span></span>
            ) : <Avatar name={p.name} size={64} />}
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              {hasL(p.desc) && <p className="mt-1 text-sm text-muted">{tl(p.desc, lang)}</p>}
            </div>
            {p.url && <Icon name="external" size={16} className="ml-auto shrink-0 text-faint" />}
          </Tilt>
        );
        return (
          <StaggerItem key={p.id}>
            {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="block h-full">{inner}</a> : inner}
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

export function PartnersBlock({ partners, n }: { partners: Partner[]; n?: number }) {
  const { t } = useSite();
  if (!partners.length) return null;
  return (
    <section id="partners" className="section">
      <div className="container-x">
        <SectionHead n={n} label={t("partners")} title={t("partnersTitle")} lead={t("partnersLead")} />
        <PartnersGrid partners={partners} />
      </div>
    </section>
  );
}
