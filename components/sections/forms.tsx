"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSite } from "@/components/site/SiteProvider";
import { SocialLinks } from "@/components/site/Footer";
import { Icon } from "@/components/ui/Icon";
import { Accordion, LogoMark, Modal, SectionHead, Soon } from "@/components/ui/bits";
import { Reveal, Stagger, StaggerItem, Tilt } from "@/components/ui/motion";
import { submitForm } from "@/lib/db";
import type { FormKind } from "@/lib/forms";
import { catLabel, PROBLEM_CATEGORIES, QUESTION_CATEGORIES, t as tr, type DictKey } from "@/lib/i18n";
import { drawQr } from "@/lib/qr";
import { COMMUNITY_IDS, type CollabType, type Community, type CommunityId, type EventDoc, type Faq, type Problem, type Scope } from "@/lib/types";
import { azDative, cx, href, initials, tl, whatsappOk } from "@/lib/utils";

// ─────────── Forma qoruyucusu: honeypot, vaxt, sürət limiti ───────────
function useGuard() {
  const [hp, setHp] = useState("");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const { lang } = useSite();
  const send = async (kind: FormKind, data: Record<string, unknown>) => {
    setErr("");
    setState("sending");
    try {
      await submitForm(kind, data, { hp, startedAt });
      setState("done");
    } catch (e) {
      const m = (e as Error).message;
      setErr(tr(lang, m === "tooFast" ? "tooFast" : m === "required" ? "fillRequired" : "formError"));
      setState("idle");
    }
  };
  const reset = () => {
    setState("idle");
    setStartedAt(Date.now());
  };
  const Honeypot = (
    <div className="hp" aria-hidden="true">
      <label>
        {tr(lang, "honeypot")}
        <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} name="website" />
      </label>
    </div>
  );
  return { send, state, err, reset, Honeypot };
}

function Field({ label, opt, children, hint, count }: { label: string; opt?: boolean; children: React.ReactNode; hint?: string; count?: [number, number] }) {
  const { t } = useSite();
  return (
    <label className="field">
      <span className="label">
        {label} {opt ? <small>{t("optional")}</small> : <small className="sr-only">{t("required")}</small>}
      </span>
      {children}
      {(hint || count) && (
        <span className="flex justify-between text-xs text-faint">
          <span>{hint}</span>
          {count && <span>{count[0]} / {count[1]} {t("chars")}</span>}
        </span>
      )}
    </label>
  );
}

function ScopeSelect({ value, onChange, label }: { value: Scope; onChange: (v: Scope) => void; label: string }) {
  const { content, t } = useSite();
  return (
    <fieldset>
      <legend className="label mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {(["all", ...COMMUNITY_IDS] as Scope[]).map((s) => (
          <button type="button" key={s} className="chip" aria-pressed={value === s} onClick={() => onChange(s)}>
            {s !== "all" && <span className="dot" style={{ background: content.communities[s].accent }} />}
            {s === "all" ? t("filterAll") : content.communities[s].name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Done({ text, onAgain }: { text: string; onAgain?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-10 text-center" role="status">
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }} className="grid h-16 w-16 place-items-center rounded-full bg-ok/15 text-ok">
        <Icon name="check" size={30} strokeWidth={2.4} />
      </motion.span>
      <p className="max-w-sm text-muted">{text}</p>
      {onAgain && <button className="btn btn-ghost btn-sm" onClick={onAgain}>OK</button>}
    </motion.div>
  );
}

// ─────────────────────────── Problem Bank ───────────────────────────
export function ProblemForm({ defaultScope = "all" }: { defaultScope?: Scope }) {
  const { lang, t } = useSite();
  const g = useGuard();
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ title: "", description: "", affected: "", current: "", category: "", community: defaultScope as Scope, name: "", contact: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const ok1 = f.title.trim() && f.description.trim();
  if (g.state === "done") return <div className="card p-6"><Done text={t("pbSent")} onAgain={() => { g.reset(); setStep(1); setF((s) => ({ ...s, title: "", description: "", affected: "", current: "" })); }} /></div>;
  return (
    <form
      className="card relative p-6 md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 1) return ok1 && setStep(2);
        g.send("problem", f);
      }}
      noValidate
    >
      {g.Honeypot}
      <ol className="mb-7 flex items-center gap-3" aria-label={t("pbStepOf")}>
        {[t("pbStep1"), t("pbStep2")].map((s, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={cx("grid h-8 w-8 place-items-center rounded-full border font-mono text-xs transition-colors", step > i ? "border-accent bg-accent text-on-accent" : "border-line2 text-faint")}>{i + 1}</span>
            <span className={cx("text-sm font-medium", step === i + 1 ? "text-fg" : "text-faint")}>{s}</span>
            {i === 0 && <span className="h-px w-8 bg-line2" aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">{t("pbStepOf")} {step} / 2</p>
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid gap-5">
            <Field label={t("pbProblemTitle")}><input className="input" value={f.title} onChange={set("title")} maxLength={160} required /></Field>
            <Field label={t("pbProblemText")} count={[f.description.length, 1500]}><textarea className="input" value={f.description} onChange={set("description")} maxLength={1500} required /></Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label={t("pbAffected")} opt><input className="input" value={f.affected} onChange={set("affected")} maxLength={300} /></Field>
              <Field label={t("pbCurrent")} opt><input className="input" value={f.current} onChange={set("current")} maxLength={300} /></Field>
            </div>
            <fieldset>
              <legend className="label mb-2">{t("pbCategory")} <small>{t("optional")}</small></legend>
              <div className="flex flex-wrap gap-2">
                {PROBLEM_CATEGORIES.map((c) => (
                  <button type="button" key={c} className="chip" aria-pressed={f.category === c} onClick={() => setF((s) => ({ ...s, category: s.category === c ? "" : c }))}>{catLabel(lang, c)}</button>
                ))}
              </div>
            </fieldset>
            <ScopeSelect label={t("pbFor")} value={f.community} onChange={(v) => setF((s) => ({ ...s, community: v }))} />
            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={!ok1}>{t("next")} <Icon name="arrow" size={16} className="arrow" /></button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label={t("name")} opt><input className="input" value={f.name} onChange={set("name")} maxLength={80} autoComplete="name" /></Field>
              <Field label={t("contactField")} opt hint={t("contactHint")}><input className="input" value={f.contact} onChange={set("contact")} maxLength={120} autoComplete="email" /></Field>
            </div>
            <p className="text-sm text-faint">{t("pbAnon")}</p>
            {g.err && <p className="text-sm text-danger" role="alert">{g.err}</p>}
            <div className="flex justify-between gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}><Icon name="arrowLeft" size={16} /> {t("back")}</button>
              <button type="submit" className="btn btn-primary" disabled={g.state === "sending"}>{g.state === "sending" ? t("sending") : t("send")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

export function ProblemList({ problems }: { problems: Problem[] }) {
  const { content, lang, t } = useSite();
  if (!problems.length) return <p className="text-sm text-muted">{t("pbEmpty")}</p>;
  return (
    <Stagger as="ul" className="space-y-3">
      {problems.map((p) => (
        <StaggerItem as="li" key={p.id} className="card card-hover p-5">
          <p className="font-medium leading-snug">{p.title}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {p.category && <span className="tag">{catLabel(lang, p.category)}</span>}
            <span className="tag border-ok/40 text-ok"><Icon name="check" size={12} /> {t("pbApproved")}</span>
            {p.community !== "all" && content.communities[p.community] && (
              <span className="flex items-center gap-1.5 text-xs text-faint"><span className="dot" style={{ background: content.communities[p.community].accent }} />{content.communities[p.community].name}</span>
            )}
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function ProblemBankBlock({ n, scope = "all", id = "problem-bank" }: { n?: number; scope?: Scope; id?: string }) {
  const { content, t } = useSite();
  const list = content.problems.filter((p) => scope === "all" || p.community === scope || p.community === "all");
  return (
    <section id={id} className="section">
      <div className="container-x">
        <SectionHead n={n} label={t("problemBank")} title={t("pbTitle")} lead={t("pbLead")} />
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <p className="eyebrow mb-4">{t("pbList")}</p>
            <ProblemList problems={list.slice(0, 6)} />
          </Reveal>
          <Reveal delay={0.1}>
            <ProblemForm defaultScope={scope} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── FAQ ───────────────────────────
export function QuestionForm({ scope = "all", kind = "question" }: { scope?: Scope; kind?: "question" | "contact" }) {
  const { lang, t } = useSite();
  const g = useGuard();
  const [f, setF] = useState({ name: "", contact: "", question: "", category: "", community: scope });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  if (g.state === "done") return <div className="card p-6"><Done text={t("thanks")} onAgain={() => { g.reset(); setF((s) => ({ ...s, question: "" })); }} /></div>;
  return (
    <form className="card grid gap-5 p-6 md:p-8" onSubmit={(e) => { e.preventDefault(); g.send(kind, f); }} noValidate>
      <h3 className="font-display text-xl font-semibold">{kind === "contact" ? t("writeUs") : t("askTitle")}</h3>
      {g.Honeypot}
      <div className="grid gap-5 md:grid-cols-2">
        <Field label={t("name")} opt><input className="input" value={f.name} onChange={set("name")} maxLength={80} autoComplete="name" /></Field>
        <Field label={t("contactField")} opt hint={t("contactHint")}><input className="input" value={f.contact} onChange={set("contact")} maxLength={120} autoComplete="email" /></Field>
      </div>
      <Field label={kind === "contact" ? t("message") : t("yourQuestion")} count={[f.question.length, 1000]}>
        <textarea className="input" value={f.question} onChange={set("question")} maxLength={1000} required />
      </Field>
      {kind === "question" && (
        <fieldset>
          <legend className="label mb-2">{t("pbCategory")} <small>{t("optional")}</small></legend>
          <div className="flex flex-wrap gap-2">
            {QUESTION_CATEGORIES.map((c) => (
              <button type="button" key={c} className="chip" aria-pressed={f.category === c} onClick={() => setF((s) => ({ ...s, category: s.category === c ? "" : c }))}>{tr(lang, `qcat_${c}` as DictKey)}</button>
            ))}
          </div>
        </fieldset>
      )}
      <ScopeSelect label={t("community")} value={f.community} onChange={(v) => setF((s) => ({ ...s, community: v }))} />
      {g.err && <p className="text-sm text-danger" role="alert">{g.err}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-faint">{t("askAnon")}</p>
        <button type="submit" className="btn btn-primary" disabled={g.state === "sending" || !f.question.trim()}>{g.state === "sending" ? t("sending") : t("send")}</button>
      </div>
    </form>
  );
}

export function FaqBlock({ faqs, n, scope = "all", withForm = true }: { faqs: Faq[]; n?: number; scope?: Scope; withForm?: boolean }) {
  const { lang, t } = useSite();
  if (!faqs.length && !withForm) return null;
  return (
    <section id="faq" className="section">
      <div className="container-x">
        <SectionHead n={n} label={t("faq")} title={t("faqTitle")} lead={t("faqLead")} />
        <div className={cx("grid gap-8", faqs.length > 0 && withForm && "lg:grid-cols-[1.3fr_1fr]")}>
          {faqs.length > 0 && <Reveal><Accordion items={faqs.map((f) => ({ q: tl(f.q, lang), a: tl(f.a, lang) }))} defaultOpen={0} /></Reveal>}
          {withForm && <Reveal delay={0.1}><QuestionForm scope={scope} /></Reveal>}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── Əməkdaşlıq ───────────────────────────
const COLLABS: { type: CollabType; icon: string }[] = [
  { type: "community", icon: "users" },
  { type: "sponsor", icon: "star" },
  { type: "mentor", icon: "bulb" },
  { type: "company", icon: "handshake" },
];

function CollabForm({ type, scope, onDone }: { type: CollabType; scope: Scope; onDone: () => void }) {
  const { t } = useSite();
  const g = useGuard();
  const [f, setF] = useState({ type, name: "", org: "", contact: "", message: "", community: scope });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  if (g.state === "done") return <Done text={t("collabSent")} onAgain={onDone} />;
  const ok = f.name.trim() && f.contact.trim() && f.message.trim();
  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); g.send("collab", f); }} noValidate>
      {g.Honeypot}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("nameFull")}><input className="input" value={f.name} onChange={set("name")} maxLength={80} required autoComplete="name" /></Field>
        <Field label={t("org")} opt><input className="input" value={f.org} onChange={set("org")} maxLength={120} autoComplete="organization" /></Field>
      </div>
      <Field label={t("contactField")} hint={t("contactHint")}><input className="input" value={f.contact} onChange={set("contact")} maxLength={120} required autoComplete="email" /></Field>
      <Field label={t("message")} count={[f.message.length, 1000]}><textarea className="input" value={f.message} onChange={set("message")} maxLength={1000} required /></Field>
      <ScopeSelect label={t("community")} value={f.community} onChange={(v) => setF((s) => ({ ...s, community: v }))} />
      {g.err && <p className="text-sm text-danger" role="alert">{g.err}</p>}
      <button type="submit" className="btn btn-primary" disabled={!ok || g.state === "sending"}>{g.state === "sending" ? t("sending") : t("send")}</button>
    </form>
  );
}

export function CollabBlock({ n, scope = "all" }: { n?: number; scope?: Scope }) {
  const { t } = useSite();
  const [open, setOpen] = useState<CollabType | null>(null);
  return (
    <section id="collab" className="section">
      <div className="container-x">
        <SectionHead n={n} label={t("collab")} title={t("collabTitle")} lead={t("collabLead")} />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLLABS.map((c) => (
            <StaggerItem key={c.type}>
              <Tilt className="card card-hover flex h-full flex-col p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/12 text-accent-text"><Icon name={c.icon} size={22} /></span>
                <h3 className="mt-6 font-display text-xl font-semibold">{t(`collab_${c.type}` as DictKey)}</h3>
                <p className="mt-2 flex-1 text-sm text-muted">{t(`collab_${c.type}_t` as DictKey)}</p>
                <button className="btn btn-ghost btn-sm mt-6 self-start" onClick={() => setOpen(c.type)}>
                  {t("apply")} <span className="sr-only">: {t(`collab_${c.type}` as DictKey)}</span> <Icon name="arrow" size={14} className="arrow" />
                </button>
              </Tilt>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
      <Modal open={open !== null} onClose={() => setOpen(null)} title={open ? `${t("applyAs")}: ${t(`collab_${open}` as DictKey)}` : ""}>
        {open && <CollabForm key={open} type={open} scope={scope} onDone={() => setOpen(null)} />}
      </Modal>
    </section>
  );
}

// ─────────────────────────── Qoşul (WhatsApp + QR) ───────────────────────────
function QrBox({ c }: { c: Community }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const logo = c.logo.dark || c.logo.light;
  useEffect(() => {
    if (!ref.current || !whatsappOk(c.links.whatsapp)) return;
    drawQr(ref.current, c.links.whatsapp, { size: 440, logo, logoText: logo ? undefined : initials(c.name.replace(/([a-z])([A-Z])/g, "$1 $2")), logoColor: c.accent }).catch(() => {});
  }, [c.links.whatsapp, logo, c.name, c.accent]);
  return <canvas ref={ref} width={440} height={440} className="h-auto w-full max-w-[220px] rounded-2xl bg-white p-2" role="img" aria-label={`${c.name} WhatsApp QR`} />;
}

export function JoinBlock({ n, community }: { n?: number; community?: CommunityId }) {
  const { content, lang, t } = useSite();
  const [sel, setSel] = useState<CommunityId>(community ?? "datatech");
  const c = content.communities[community ?? sel];
  const wa = whatsappOk(c.links.whatsapp);
  return (
    <section id="join" className="section">
      <div className="container-x">
        <Reveal className="card relative overflow-hidden p-6 md:p-12" >
          <div className="aurora opacity-40" aria-hidden="true" style={{ ["--accent" as string]: c.accent }} />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="eyebrow mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-accent-text/70" aria-hidden="true" />
                {n !== undefined && <span>{String(n).padStart(2, "0")} /</span>}
                <span className="eyebrow-accent">{t("join")}</span>
              </div>
              <h2 className="h-section">{community ? (lang === "az" ? `${azDative(c.name)} qoşul` : `Join ${c.name}`) : t("joinTitle")}</h2>
              <p className="lead mt-4 max-w-xl">{community ? tl(c.field, lang) : t("joinLead")}</p>
              {!community && (
                <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label={t("selectCommunity")}>
                  {COMMUNITY_IDS.map((id) => (
                    <button key={id} role="tab" aria-selected={sel === id} className="chip" onClick={() => setSel(id)} style={sel === id ? { background: content.communities[id].accent, borderColor: content.communities[id].accent } : undefined}>
                      <span className="dot" style={{ background: sel === id ? "currentColor" : content.communities[id].accent }} /> {content.communities[id].name}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {wa ? (
                  <a href={c.links.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ background: c.accent, color: undefined }}>
                    <Icon name="whatsapp" size={18} /> {t("whatsappJoin")} <span className="sr-only">{t("newTab")}</span>
                  </a>
                ) : (
                  <p className="text-sm text-muted">{t("noWhatsapp")}</p>
                )}
                {!community && <Link href={href(lang, `/${c.id}`)} className="btn btn-ghost">{t("viewCommunity")} <Icon name="arrow" size={14} className="arrow" /></Link>}
              </div>
              <SocialLinks links={{ ...c.links, whatsapp: "" }} className="mt-6" />
            </div>
            <div className="flex flex-col items-center gap-3">
              {wa ? (
                <>
                  <QrBox c={c} />
                  <p className="flex items-center gap-2 text-sm text-muted"><Icon name="qr" size={16} /> {t("scan")}</p>
                </>
              ) : (
                <div className="grid aspect-square w-full max-w-[220px] place-items-center rounded-2xl border border-dashed border-line2">
                  <LogoMark c={c} size={96} rounded={20} />
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────── Tədbir qeydiyyatı ───────────────────────────
export function RegistrationForm({ e }: { e: EventDoc }) {
  const { t } = useSite();
  const g = useGuard();
  const [f, setF] = useState({ eventId: e.id, eventSlug: e.slug, name: "", contact: "", group: "", note: "" });
  const set = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: ev.target.value }));
  if (g.state === "done") return <Done text={t("registered")} />;
  return (
    <form className="grid gap-4" onSubmit={(ev) => { ev.preventDefault(); g.send("registration", f); }} noValidate>
      {g.Honeypot}
      <Field label={t("nameFull")}><input className="input" value={f.name} onChange={set("name")} maxLength={80} required autoComplete="name" /></Field>
      <Field label={t("contactField")} hint={t("contactHint")}><input className="input" value={f.contact} onChange={set("contact")} maxLength={120} required autoComplete="email" /></Field>
      <Field label={t("group")} opt><input className="input" value={f.group} onChange={set("group")} maxLength={80} /></Field>
      <Field label={t("note")} opt><textarea className="input min-h-[80px]" value={f.note} onChange={set("note")} maxLength={300} /></Field>
      {g.err && <p className="text-sm text-danger" role="alert">{g.err}</p>}
      <button type="submit" className="btn btn-primary" disabled={!f.name.trim() || !f.contact.trim() || g.state === "sending"}>{g.state === "sending" ? t("sending") : t("registerBtn")}</button>
    </form>
  );
}

export { Soon };
