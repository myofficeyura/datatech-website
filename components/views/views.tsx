"use client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Hero } from "@/components/sections/Hero";
import {
  AboutCommunity, AboutShared, CommunitiesGrid, EventCalendar, EventCard, EventsBlock, MentorsBlock, MentorsGrid, PartnersBlock, PartnersGrid, RolesBlock,
  StatsRow, TeamBlock, TeamGrid, WorkStepper,
} from "@/components/sections/blocks";
import { CollabBlock, FaqBlock, JoinBlock, ProblemBankBlock, ProblemForm, ProblemList, QuestionForm, RegistrationForm } from "@/components/sections/forms";
import { NetworkCanvas } from "@/components/sections/NetworkCanvas";
import { useSite } from "@/components/site/SiteProvider";
import { SocialLinks } from "@/components/site/Footer";
import { Icon } from "@/components/ui/Icon";
import { Accordion, Img, LogoMark, Modal, SectionHead, Soon, toast } from "@/components/ui/bits";
import { Reveal, Stagger, StaggerItem, Tilt } from "@/components/ui/motion";
import { COMMUNITY_IDS, type CommunityId, type Scope } from "@/lib/types";
import { cx, fmtDate, hasL, href, isPast, mailto, tl, whatsappOk } from "@/lib/utils";

/** Bölmələri ardıcıl nömrələ (görünməyənlər nömrə almır). Hero = 01. */
function numbered(sections: (false | null | undefined | ((n: number) => React.ReactNode))[]) {
  let n = 1;
  return sections.filter(Boolean).map((s, i) => <div key={i}>{(s as (n: number) => React.ReactNode)(++n)}</div>);
}

function PageHead({ label, title, lead, children }: { label: string; title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <section className="noise relative overflow-hidden pb-12 pt-36 md:pb-16 md:pt-44">
      <div className="aurora opacity-40" aria-hidden="true" />
      <div className="bg-grid absolute inset-0" aria-hidden="true" />
      <NetworkCanvas className="opacity-40" />
      <div className="container-x relative">
        <p className="fade-up eyebrow mb-5 flex items-center gap-3"><span className="h-px w-10 bg-accent-text/70" aria-hidden="true" /><span className="eyebrow-accent">{label}</span></p>
        <h1 className="fade-up h-display text-[clamp(2.4rem,6vw,4.5rem)]" style={{ animationDelay: "0.08s" }}>{title}</h1>
        {lead && <p className="fade-up lead mt-5 max-w-2xl" style={{ animationDelay: "0.16s" }}>{lead}</p>}
        {children && <div className="fade-up mt-8" style={{ animationDelay: "0.24s" }}>{children}</div>}
      </div>
    </section>
  );
}

// ─────────────────────────── Ana səhifə ───────────────────────────
export function HomeView() {
  const { content, lang, t } = useSite();
  const s = content.site;
  const membersSum = COMMUNITY_IDS.reduce((a, id) => a + (content.communities[id].stats.members || 0), 0);
  const events = content.events;
  const joint = events.filter((e) => e.with.filter((x) => x !== e.community).length > 0);
  const sharedFaqs = content.faqs.filter((f) => f.community === "all");
  const sharedPartners = content.partners.filter((p) => p.community === "all");
  return (
    <>
      <Hero hero={s.hero} highlight={2} primary={{ label: t("join"), to: `${href(lang, "/")}#join` }} secondary={{ label: t("communities"), to: `${href(lang, "/")}#communities` }} />
      <div id="content-start" />
      <StatsRow items={[
        { label: t("membersCap"), value: s.stats.members || membersSum, suffix: "+" },
        { label: t("communitiesCount"), value: COMMUNITY_IDS.length },
        { label: t("eventsHeld"), value: s.stats.events || events.length },
        { label: t("partnersCount"), value: s.stats.partners || content.partners.length },
      ]} />
      {numbered([
        (n) => <CommunitiesGrid n={n} />,
        (hasL(s.about.title) || hasL(s.about.text)) && ((n) => <AboutShared n={n} />),
        (n) => (
          <section id="joint" className="section">
            <div className="container-x">
              <SectionHead n={n} label={t("jointEvents")} title={t("calendar")} lead={t("eventsLead")}
                right={<Link href={href(lang, "/events")} className="btn btn-ghost btn-sm">{t("allEvents")} <Icon name="arrow" size={14} className="arrow" /></Link>} />
              <EventCalendar events={events} />
              {joint.length > 0 && (
                <div className="mt-12">
                  <p className="eyebrow mb-5">{t("jointEvents")}</p>
                  <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {joint.map((e) => <StaggerItem key={e.id}><EventCard e={e} /></StaggerItem>)}
                  </Stagger>
                </div>
              )}
            </div>
          </section>
        ),
        (n) => <ProblemBankBlock n={n} />,
        sharedPartners.length > 0 && ((n) => <PartnersBlock n={n} partners={sharedPartners} />),
        (n) => <CollabBlock n={n} />,
        (n) => <FaqBlock n={n} faqs={sharedFaqs} />,
        (n) => <JoinBlock n={n} />,
      ])}
    </>
  );
}

// ─────────────────────────── İcma səhifəsi ───────────────────────────
export function CommunityView({ id }: { id: CommunityId }) {
  const { content, lang, t } = useSite();
  const c = content.communities[id];
  if (!c) notFound();
  const events = content.events.filter((e) => e.community === id || e.with.includes(id));
  const faqs = content.faqs.filter((f) => f.community === id);
  const partners = content.partners.filter((p) => p.community === id);
  const wa = whatsappOk(c.links.whatsapp);
  const hasWork = c.work.steps.length > 0 || hasL(c.work.title);
  return (
    <>
      <Hero
        hero={c.hero}
        community={c}
        highlight={id === "innotech" ? 2 : 0}
        primary={wa ? { label: t("joinCommunity"), to: c.links.whatsapp, external: true } : { label: t("join"), to: `${href(lang, `/${id}`)}#join` }}
        secondary={{ label: hasWork ? t("howWeWork") : t("about"), to: hasWork ? "#what" : "#about" }}
      />
      <div id="content-start" />
      <StatsRow items={[
        { label: t("membersCap"), value: c.stats.members, suffix: "+" },
        { label: t("eventsHeld"), value: c.stats.events || events.filter((e) => isPast(e.date)).length },
        { label: t("projects"), value: c.stats.projects },
      ]} />
      {numbered([
        (n) => <AboutCommunity c={c} n={n} />,
        (n) => <WorkStepper c={c} n={n} />,
        (c.roles.items.length > 0 || c.roles.join.length > 0) && ((n) => <RolesBlock c={c} n={n} />),
        (n) => <EventsBlock n={n} events={events} lead={t("eventsLead")} />,
        (n) => <ProblemBankBlock n={n} scope={id} />,
        (n) => <TeamBlock c={c} n={n} />,
        content.mentors.some((m) => m.community === id) && ((n) => <MentorsBlock c={c} n={n} />),
        partners.length > 0 && ((n) => <PartnersBlock n={n} partners={partners} />),
        (n) => <CollabBlock n={n} scope={id} />,
        (n) => <FaqBlock n={n} faqs={faqs} scope={id} />,
        (n) => <JoinBlock n={n} community={id} />,
      ])}
    </>
  );
}

// ─────────────────────────── Tədbirlər ───────────────────────────
export function EventsView() {
  const { content, t } = useSite();
  const [f, setF] = useState<Scope>("all");
  const list = f === "all" ? content.events : content.events.filter((e) => e.community === f || e.with.includes(f));
  return (
    <>
      <PageHead label={t("events")} title={t("allEvents")} lead={t("eventsLead")}>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("community")}>
          {(["all", ...COMMUNITY_IDS] as Scope[]).map((s) => (
            <button key={s} role="tab" aria-selected={f === s} className="chip" onClick={() => setF(s)}>
              {s !== "all" && <span className="dot" style={{ background: f === s ? "currentColor" : content.communities[s].accent }} />}
              {s === "all" ? t("filterAll") : content.communities[s].name}
            </button>
          ))}
        </div>
      </PageHead>
      <AnimatePresence mode="wait">
        <motion.div key={f} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <EventsBlock events={list} showAll={false} id="list" bare />
        </motion.div>
      </AnimatePresence>
      <section className="section pt-0">
        <div className="container-x">
          <SectionHead label={t("calendar")} title={t("calendar")} />
          <EventCalendar events={list} />
        </div>
      </section>
    </>
  );
}

export function EventView({ slug }: { slug: string }) {
  const { content, lang, t } = useSite();
  const e = content.events.find((x) => x.slug === slug || x.id === slug);
  const [img, setImg] = useState<number | null>(null);
  const [reg, setReg] = useState(false);
  if (!e) {
    return (
      <PageHead label={t("events")} title={t("notFound")} lead={t("notFoundText")}>
        <Link href={href(lang, "/events")} className="btn btn-primary">{t("allEvents")}</Link>
      </PageHead>
    );
  }
  const host = content.communities[e.community];
  const all = [e.community, ...e.with.filter((x) => x !== e.community)];
  const open = e.registrationOpen && !isPast(e.date);
  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: tl(e.title, lang), url });
      else {
        await navigator.clipboard.writeText(url);
        toast(t("copied"));
      }
    } catch {}
  };
  const lines = tl(e.body, lang).split("\n").filter((x) => x.trim());
  return (
    <div style={{ ["--accent" as string]: host?.accent }}>
      <section className="relative overflow-hidden pb-14 pt-32 md:pt-40">
        {e.cover && <Img src={e.cover} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/80 to-bg" aria-hidden="true" />
        <div className="container-x relative">
          <Link href={href(lang, "/events")} className="fade-up mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-fg"><Icon name="arrowLeft" size={16} /> {t("allEvents")}</Link>
          <div className="fade-up flex flex-wrap gap-2" style={{ animationDelay: "0.05s" }}>
            {hasL(e.type) && <span className="tag tag-accent">{tl(e.type, lang)}</span>}
            {all.length > 1 && <span className="tag">{t("joint")}</span>}
          </div>
          <h1 className="fade-up h-display mt-5 max-w-4xl text-[clamp(2.2rem,5.5vw,4.2rem)]" style={{ animationDelay: "0.1s" }}>{tl(e.title, lang)}</h1>
          {hasL(e.summary) && <p className="fade-up lead mt-5 max-w-3xl" style={{ animationDelay: "0.16s" }}>{tl(e.summary, lang)}</p>}
          <dl className="fade-up mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" style={{ animationDelay: "0.22s" }}>
            <div><dt className="eyebrow mb-2">{t("date")}</dt><dd className="font-semibold">{fmtDate(e.date, lang)}{e.time ? `, ${e.time}` : ""}</dd></div>
            {hasL(e.place) && <div><dt className="eyebrow mb-2">{t("place")}</dt><dd className="font-semibold">{tl(e.place, lang)}</dd></div>}
            {e.participants && <div><dt className="eyebrow mb-2">{t("participation")}</dt><dd className="font-semibold">{e.participants} {t("participants")}</dd></div>}
            <div>
              <dt className="eyebrow mb-2">{all.length > 1 ? t("joint") : t("organizer")}</dt>
              <dd className="flex flex-wrap gap-2">
                {all.map((id) => content.communities[id] && (
                  <Link key={id} href={href(lang, `/${id}`)} className="flex items-center gap-2 rounded-full border border-line2 py-1 pl-1 pr-3 text-sm font-medium hover:border-accent/60">
                    <LogoMark c={content.communities[id]} size={24} rounded={7} /> {content.communities[id].name}
                  </Link>
                ))}
              </dd>
            </div>
          </dl>
          <div className="fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.28s" }}>
            {open ? (
              <button className="btn btn-primary" onClick={() => setReg(true)}>{t("registerBtn")} <Icon name="arrow" size={16} className="arrow" /></button>
            ) : e.registrationOpen === false && !isPast(e.date) ? (
              <span className="tag">{t("registrationClosed")}</span>
            ) : null}
            <button className="btn btn-ghost" onClick={share}><Icon name="share" size={16} /> {t("share")}</button>
          </div>
        </div>
      </section>

      {(lines.length > 0 || e.winners.length > 0) && (
        <section className="section pt-6">
          <div className="container-x grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            {lines.length > 0 && (
              <Reveal>
                <p className="eyebrow mb-4">{t("aboutEvent")}</p>
                <h2 className="mb-6 font-display text-2xl font-semibold">{t("program")}</h2>
                <ol className="relative space-y-6 border-l border-line2 pl-6">
                  {lines.map((l, i) => {
                    const m = l.match(/^(\d{1,2}[:.]\d{2}\s*[–-]\s*\d{1,2}[:.]\d{2})\s*[—-]\s*(.*)$/);
                    return (
                      <li key={i} className="relative">
                        <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-bg" aria-hidden="true" />
                        {m ? (<><p className="font-mono text-sm text-accent-text">{m[1]}</p><p className="mt-1 text-muted">{m[2]}</p></>) : <p className="text-muted">{l}</p>}
                      </li>
                    );
                  })}
                </ol>
              </Reveal>
            )}
            {e.winners.length > 0 && (
              <Reveal delay={0.1}>
                <p className="eyebrow mb-4">{t("winners")}</p>
                <ol className="space-y-3">
                  {e.winners.map((w, i) => (
                    <li key={i} className="card flex items-center gap-4 p-5">
                      <span className={cx("grid h-11 w-11 place-items-center rounded-full", i === 0 ? "bg-amber-400/20 text-amber-300" : i === 1 ? "bg-slate-300/20 text-slate-300" : "bg-orange-400/20 text-orange-300")}><Icon name="trophy" size={20} /></span>
                      <span>
                        <span className="block font-mono text-xs uppercase text-faint">{t(i === 0 ? "place1" : i === 1 ? "place2" : "place3")}</span>
                        <span className="font-display text-lg font-semibold">{w}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {e.gallery.length > 0 && (
        <section className="section pt-0">
          <div className="container-x">
            <SectionHead label={`${t("gallery")} (${e.gallery.length})`} />
            <Stagger className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {e.gallery.map((g, i) => (
                <StaggerItem key={g + i} className="mb-4 break-inside-avoid">
                  <button className="group relative block w-full overflow-hidden rounded-2xl border border-line" onClick={() => setImg(i)} aria-label={`${t("gallery")} ${i + 1}`}>
                    <Img src={g} alt={`${tl(e.title, lang)} — ${i + 1}`} width={800} height={600} sizes="(min-width:1024px) 400px, 100vw" className="h-auto w-full transition-transform duration-700 group-hover:scale-105" />
                  </button>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      <AnimatePresence>
        {img !== null && (
          <motion.div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/90 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setImg(null)} role="dialog" aria-modal="true" aria-label={t("gallery")}
            onKeyDown={(k) => { if (k.key === "Escape") setImg(null); if (k.key === "ArrowRight") setImg((x) => ((x ?? 0) + 1) % e.gallery.length); if (k.key === "ArrowLeft") setImg((x) => ((x ?? 0) - 1 + e.gallery.length) % e.gallery.length); }} tabIndex={-1}>
            <motion.div key={img} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-h-[85vh] w-full max-w-5xl" onClick={(x) => x.stopPropagation()}>
              <Img src={e.gallery[img]!} alt="" width={1600} height={1200} sizes="100vw" className="mx-auto max-h-[85vh] w-auto rounded-xl object-contain" />
            </motion.div>
            <button className="icon-btn absolute right-4 top-4 bg-black/50 text-white" aria-label={t("close")} onClick={() => setImg(null)} autoFocus><Icon name="close" /></button>
            <button className="icon-btn absolute left-4 top-1/2 bg-black/50 text-white" aria-label="‹" onClick={(x) => { x.stopPropagation(); setImg((v) => ((v ?? 0) - 1 + e.gallery.length) % e.gallery.length); }}><Icon name="chevronLeft" /></button>
            <button className="icon-btn absolute right-4 top-1/2 bg-black/50 text-white" aria-label="›" onClick={(x) => { x.stopPropagation(); setImg((v) => ((v ?? 0) + 1) % e.gallery.length); }}><Icon name="chevronRight" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={reg} onClose={() => setReg(false)} title={`${t("register")}: ${tl(e.title, lang)}`}>
        <RegistrationForm e={e} />
      </Modal>
    </div>
  );
}

// ─────────────────────────── Problem Bank ───────────────────────────
export function ProblemBankView() {
  const { content, t } = useSite();
  const [f, setF] = useState<Scope>("all");
  const list = f === "all" ? content.problems : content.problems.filter((p) => p.community === f || p.community === "all");
  return (
    <>
      <PageHead label={t("problemBank")} title={t("pbTitle")} lead={t("pbLead")} />
      <section className="section pt-4">
        <div className="container-x grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <Reveal><ProblemForm /></Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow mb-4">{t("pbList")}</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {(["all", ...COMMUNITY_IDS] as Scope[]).map((s) => (
                <button key={s} className="chip" aria-pressed={f === s} onClick={() => setF(s)}>
                  {s === "all" ? t("filterAll") : content.communities[s].name}
                </button>
              ))}
            </div>
            <ProblemList problems={list} />
          </Reveal>
        </div>
      </section>
    </>
  );
}

// ─────────────────────────── Komanda ───────────────────────────
export function TeamView() {
  const { content, lang, t } = useSite();
  const [tab, setTab] = useState<CommunityId>("datatech");
  const c = content.communities[tab];
  const people = content.team.filter((p) => p.community === tab);
  const mentors = content.mentors.filter((m) => m.community === tab);
  return (
    <>
      <PageHead label={t("team")} title={t("allTeams")} lead={t("teamLead")}>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("communities")}>
          {COMMUNITY_IDS.map((id) => {
            const x = content.communities[id];
            return (
              <button key={id} role="tab" aria-selected={tab === id} aria-controls="team-panel" onClick={() => setTab(id)}
                className={cx("flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-sm font-medium transition-all", tab === id ? "border-transparent text-white" : "border-line2 text-muted hover:text-fg")}
                style={tab === id ? { background: x.accent } : undefined}>
                <LogoMark c={x} size={28} rounded={8} /> {x.name}
              </button>
            );
          })}
        </div>
      </PageHead>
      <div style={{ ["--accent" as string]: c.accent }} id="team-panel" role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            <section className="section pt-4">
              <div className="container-x">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <h2 className="font-display text-2xl font-semibold">{c.name} <span className="text-faint">· {tl(c.field, lang)}</span></h2>
                  <Link href={href(lang, `/${tab}`)} className="btn btn-ghost btn-sm shrink-0">{t("viewCommunity")} <Icon name="arrow" size={14} className="arrow" /></Link>
                </div>
                {people.length ? <TeamGrid people={people} accent={c.accent} /> : <Soon title={t("soon")} text={t("soonText")} />}
                {mentors.length > 0 && (
                  <div className="mt-16">
                    <h3 className="mb-6 font-display text-2xl font-semibold">{t("ourMentors")}</h3>
                    <MentorsGrid mentors={mentors} />
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

// ─────────────────────────── Tərəfdaşlar ───────────────────────────
export function PartnersView() {
  const { content, t } = useSite();
  return (
    <>
      <PageHead label={t("partners")} title={t("partnersTitle")} lead={t("partnersLead")} />
      <section className="section pt-4">
        <div className="container-x">
          {content.partners.length ? <PartnersGrid partners={content.partners} /> : <Soon title={t("soon")} text={t("partnersEmpty")} />}
        </div>
      </section>
      <CollabBlock />
    </>
  );
}

// ─────────────────────────── FAQ ───────────────────────────
export function FaqView() {
  const { content, lang, t } = useSite();
  const [tab, setTab] = useState<Scope>("all");
  const list = content.faqs.filter((f) => f.community === tab);
  const tabs = (["all", ...COMMUNITY_IDS] as Scope[]);
  return (
    <>
      <PageHead label={t("faq")} title={t("faqTitle")} lead={t("faqLead")}>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("community")}>
          {tabs.map((s) => (
            <button key={s} role="tab" aria-selected={tab === s} className="chip" onClick={() => setTab(s)}>
              {s !== "all" && <span className="dot" style={{ background: tab === s ? "currentColor" : content.communities[s].accent }} />}
              {s === "all" ? t("filterAll") : content.communities[s].name}
            </button>
          ))}
        </div>
      </PageHead>
      <section className="section pt-4">
        <div className="container-x grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {list.length ? <Accordion items={list.map((f) => ({ q: tl(f.q, lang), a: tl(f.a, lang) }))} defaultOpen={0} /> : <Soon title={t("soon")} text={t("soonText")} />}
            </motion.div>
          </AnimatePresence>
          <Reveal><QuestionForm scope={tab} /></Reveal>
        </div>
      </section>
    </>
  );
}

// ─────────────────────────── Əlaqə ───────────────────────────
export function ContactView() {
  const { content, lang, t } = useSite();
  return (
    <>
      <PageHead label={t("contact")} title={t("contactTitle")} lead={t("contactLead")} />
      <section className="section pt-4">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <Stagger className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {COMMUNITY_IDS.map((id) => {
              const c = content.communities[id];
              const has = Object.values(c.links).some((v) => v?.trim());
              return (
                <StaggerItem key={id}>
                  <Tilt className="card h-full p-5" style={{ ["--accent" as string]: c.accent }}>
                    <div className="flex items-center gap-3">
                      <LogoMark c={c} size={44} rounded={12} />
                      <div>
                        <p className="font-display text-lg font-semibold">{c.name}</p>
                        <p className="text-xs text-faint">{tl(c.field, lang)}</p>
                      </div>
                    </div>
                    {c.links.email && <a href={mailto(c.links.email)} className="mt-4 flex items-center gap-2 text-sm text-accent-text hover:underline"><Icon name="mail" size={16} /> {c.links.email}</a>}
                    {has ? <SocialLinks links={{ ...c.links, email: "" }} className="mt-4" /> : <p className="mt-4 text-sm text-faint">{t("soon")}</p>}
                  </Tilt>
                </StaggerItem>
              );
            })}
          </Stagger>
          <Reveal delay={0.1}><QuestionForm kind="contact" /></Reveal>
        </div>
      </section>
    </>
  );
}

export function NotFoundView() {
  const { lang, t } = useSite();
  return (
    <PageHead label="404" title={t("notFound")} lead={t("notFoundText")}>
      <Link href={href(lang, "/")} className="btn btn-primary">{t("home")} <Icon name="arrow" size={16} className="arrow" /></Link>
    </PageHead>
  );
}
