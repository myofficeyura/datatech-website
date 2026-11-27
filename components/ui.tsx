"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EVENTS, type EventItem, type L, type Mentor } from "@/lib/data";
import { fmtDate, useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { firebaseEnabled } from "@/lib/firebase";
import { getRecord, setRecord, listRecords, type Rec } from "@/lib/store";
import { Icon } from "./Icon";
import { useToast } from "./Shell";

export function MentorCard({ m }: { m: Mentor }) {
  const { tr, lang } = useLang();
  return (
    <article className="panel mentor">
      <img src={m.photo} alt={m.name} width={88} height={88} />
      <div>
        <b>{m.name}</b>
        <span className="mt">{tr(m.title)}</span>
        <p>{tr(m.topics)}</p>
        {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn{lang === "az" ? " profili" : " profile"} →</a>}
      </div>
    </article>
  );
}

export function Empty({ text }: { text?: L | string }) {
  const { tr, lang } = useLang();
  return <div className="panel box" style={{ textAlign: "center", padding: "36px 20px" }}><p className="muted">{text ? tr(text) : lang === "az" ? "Tezliklə burada olacaq." : "Coming soon."}</p></div>;
}

export function PageHead({ eyebrow, title, lead, children }: { eyebrow?: L | string; title: L | string; lead?: L | string; children?: ReactNode }) {
  const { tr } = useLang();
  return (
    <div className="page-h rise">
      {eyebrow && <div className="eyebrow">{tr(eyebrow)}</div>}
      <h1>{tr(title)}</h1>
      {lead && <p>{tr(lead)}</p>}
      {children}
    </div>
  );
}

export function SecHead({ eyebrow, title, href, linkText }: { eyebrow?: string; title: string; href?: string; linkText?: string }) {
  return (
    <div className="sec-h">
      <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2 style={{ marginTop: 6 }}>{title}</h2></div>
      {href && <Link href={href}>{linkText}</Link>}
    </div>
  );
}

export function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const [v, setV] = useState(to);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now(), dur = 1100;
    let raf = 0;
    const step = (n: number) => { const p = Math.min(1, (n - t0) / dur); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step); };
    setV(0); raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{v.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}</>;
}

export function DemoBanner() {
  const { lang } = useLang();
  if (firebaseEnabled) return null;
  return <div className="banner">{lang === "az" ? "Demo rejimi: Firebase hələ qoşulmayıb, göndərilən məlumat yalnız bu brauzerdə saxlanır." : "Demo mode: Firebase isn't connected yet, submissions stay in this browser only."}</div>;
}

const TYPE_TAG: Record<EventItem["type"], L> = {
  event: { az: "Tədbir", en: "Event" }, workshop: { az: "Workshop", en: "Workshop" },
  hackathon: { az: "Hackathon", en: "Hackathon" }, info: { az: "İnfo gün", en: "Info day" },
};

export function useRegistration(slug: string) {
  const { user, signIn } = useAuth();
  const { lang } = useLang();
  const toast = useToast();
  const [reg, setReg] = useState(false);
  useEffect(() => {
    if (!user) { setReg(false); return; }
    getRecord("registrations", `${slug}_${user.uid}`).then((r) => setReg(Boolean(r && r.active))).catch(() => {});
  }, [user, slug]);
  const toggle = async () => {
    if (!user) { await signIn(); return; }
    const next = !reg;
    setReg(next);
    try {
      await setRecord("registrations", `${slug}_${user.uid}`, { event: slug, uid: user.uid, name: user.name, active: next });
      toast(next ? (lang === "az" ? "Qeydiyyat tamamlandı" : "You're registered") : (lang === "az" ? "Qeydiyyat ləğv edildi" : "Registration cancelled"));
    } catch { setReg(!next); toast(lang === "az" ? "Alınmadı, yenidən yoxla" : "Failed, try again"); }
  };
  return { reg, toggle, signedIn: Boolean(user) };
}

export function RegButton({ slug, full }: { slug: string; full?: boolean }) {
  const { t } = useLang();
  const { reg, toggle } = useRegistration(slug);
  return <button className={"btn pri sm" + (reg ? " done" : "")} style={full ? { width: "100%" } : undefined} type="button" onClick={toggle}>{reg ? t("registered") : t("register")}</button>;
}

export function DateBox({ iso }: { iso: string }) {
  const { lang } = useLang();
  const d = new Date(iso + "T12:00:00");
  return <div className="date"><b>{String(d.getDate()).padStart(2, "0")}</b><span>{fmtDate(iso, lang, { month: "short" })}</span></div>;
}

export function EventCard({ e }: { e: EventItem }) {
  const { tr, t, lang } = useLang();
  const left = e.capacity - e.registered;
  return (
    <article className="panel ev">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
        <DateBox iso={e.date} />
        <span className={"tag" + (e.type === "hackathon" ? " a" : "")}>{tr(TYPE_TAG[e.type])}</span>
      </div>
      <Link href={`/tedbirler/${e.slug}`} style={{ textDecoration: "none" }}><h3>{tr(e.title)}</h3></Link>
      <div className="meta">
        <span><Icon name="clock" />{fmtDate(e.date, lang, { day: "numeric", month: "long" })}{e.time && `, ${e.time}`}</span>
        <span><Icon name="pin" />{tr(e.place)}</span>
      </div>
      <div>
        {e.capacity > 0 && <><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span className="muted">{t("seats")}</span><span className="num">{left} / {e.capacity}</span></div>
        <div className="seats"><i style={{ width: `${Math.round((e.registered / e.capacity) * 100)}%` }} /></div></>}
      </div>
      <div className="foot">
        <Link href={`/tedbirler/${e.slug}`} className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{lang === "az" ? "Ətraflı" : "Details"}</Link>
        <RegButton slug={e.slug} />
      </div>
    </article>
  );
}

export const upcomingEvents = () => EVENTS.filter((e) => !e.past).sort((a, b) => a.date.localeCompare(b.date));
export const pastEvents = () => EVENTS.filter((e) => e.past).sort((a, b) => b.date.localeCompare(a.date));

const SAMPLE_LB: Rec[] = [];

export function useLeaderboard(n = 50) {
  const [rows, setRows] = useState<Rec[] | null>(null);
  useEffect(() => {
    if (!firebaseEnabled) { setRows(SAMPLE_LB.slice(0, n)); return; }
    listRecords("members", { order: "points", dir: "desc", limit: n }).then(setRows).catch(() => setRows([]));
  }, [n]);
  return rows;
}

export function LbRows({ rows, meId, pick }: { rows: Rec[]; meId?: string; pick?: number[] }) {
  const ini = (n: string) => n.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const list = pick ? pick.filter((i) => rows[i]).map((i) => [rows[i], i] as const) : rows.map((r, i) => [r, i] as const);
  return (
    <div className="list">
      {list.map(([r, i]) => (
        <div key={r.id} className={"row" + (r.id === meId ? " me" : "")}>
          <span className="rank">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
          <span className="lb-av">{ini(String(r.name || "?"))}</span>
          <div className="grow"><b>{String(r.name)}</b></div>
          <span className="pts">{Number(r.points || 0).toLocaleString("en-US")}</span>
        </div>
      ))}
    </div>
  );
}

export function SignInGate({ children, why }: { children: ReactNode; why?: string }) {
  const { user, ready, signIn, error } = useAuth();
  const { t, lang } = useLang();
  if (!ready) return <div className="empty">{t("loading")}</div>;
  if (user) return <>{children}</>;
  return (
    <div className="panel signin-card">
      <Icon name="user" size={40} style={{ color: "var(--blue-hi)" }} />
      <h2>{t("signin")}</h2>
      <p className="muted">{why || (lang === "az" ? "BMU e-poçtunla daxil ol." : "Sign in with your BEU email.")}</p>
      <button className="btn pri" type="button" onClick={signIn}>{firebaseEnabled ? "Google ilə daxil ol" : (lang === "az" ? "Demo hesabla daxil ol" : "Sign in with demo account")}</button>
      {error && <p className="err">{error}</p>}
    </div>
  );
}

/** Sadə forma: sahələri ad=dəyər kimi toplayır və kolleksiyaya yazır. */
export function useSubmit(col: string, extra?: () => Record<string, unknown>) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => { data[k] = String(v).slice(0, 4000); });
    setState("busy");
    try { const { addRecord } = await import("@/lib/store"); await addRecord(col, { ...data, ...(extra?.() || {}) }); setState("done"); (e.target as HTMLFormElement).reset(); }
    catch { setState("error"); }
  };
  return { state, onSubmit, setState };
}

export function SubmitRow({ state }: { state: string }) {
  const { t, lang } = useLang();
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <button className="btn pri" disabled={state === "busy"}>{state === "busy" ? t("loading") : t("send")}</button>
      {state === "done" && <span className="ok">{t("sent")}</span>}
      {state === "error" && <span className="err">{lang === "az" ? "Göndərilmədi. Yenidən yoxla." : "Not sent. Please try again."}</span>}
    </div>
  );
}
