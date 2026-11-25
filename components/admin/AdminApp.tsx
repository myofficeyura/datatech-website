"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Toaster } from "@/components/ui/bits";
import { useAdminAuth, type Me } from "@/lib/admin-auth";
import { MODE, subscribeCol } from "@/lib/db";
import { normCommunity, normSite } from "@/lib/normalize";
import { COMMUNITY_IDS, type ColName, type Community, type CommunityId, type SiteSettings } from "@/lib/types";
import { cx, onColor } from "@/lib/utils";
import { AdminsPanel, BrandPanel, CollectionsPanel, DashboardPanel, InboxPanel, InfoPanel, ProblemsPanel, QrPanel, TextsPanel, type AdminData } from "./panels";

const NAV = [
  { k: "dashboard", label: "İcmal", icon: "home" },
  { k: "brand", label: "Loqo və rəng", icon: "palette" },
  { k: "texts", label: "Mətnlər", icon: "text" },
  { k: "info", label: "Linklər və statistika", icon: "link" },
  { k: "events", label: "Tədbirlər", icon: "calendar" },
  { k: "team", label: "Komanda", icon: "users" },
  { k: "mentors", label: "Mentorlar", icon: "bulb" },
  { k: "partners", label: "Tərəfdaşlar", icon: "handshake" },
  { k: "faqs", label: "FAQ", icon: "question" },
  { k: "problems", label: "Problem Bank", icon: "inbox" },
  { k: "inbox", label: "Suallar və müraciətlər", icon: "mail" },
  { k: "qr", label: "QR generator", icon: "qr" },
  { k: "admins", label: "Adminlər", icon: "shield", superOnly: true },
] as const;
type Tab = (typeof NAV)[number]["k"];

function useCol<T extends { id: string }>(name: ColName, enabled: boolean) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!enabled) return;
    return subscribeCol<T>(name, (r) => { setRows(r); setErr(""); }, (e) => setErr(e.message));
  }, [name, enabled]);
  return useMemo(() => ({ rows: rows ?? (EMPTY as T[]), loaded: rows !== null, err }), [rows, err]);
}
const EMPTY: never[] = [];

function useAdminData(me: Me | null): AdminData {
  const on = Boolean(me);
  const site = useCol<{ id: string }>("site", on);
  const communities = useCol<{ id: string }>("communities", on);
  const events = useCol("events", on);
  const team = useCol("team", on);
  const mentors = useCol("mentors", on);
  const partners = useCol("partners", on);
  const faqs = useCol("faqs", on);
  const problems = useCol("problems", on);
  const questions = useCol("questions", on);
  const collabs = useCol("collabs", on);
  const registrations = useCol("registrations", on);
  return useMemo(() => {
    const siteDoc = site.rows.find((r) => r.id === "main");
    const comms = {} as Record<CommunityId, Community>;
    for (const id of COMMUNITY_IDS) comms[id] = normCommunity(id, communities.rows.find((c) => c.id === id));
    const errors = [site, communities, events, team, problems, questions].map((x) => x.err).filter(Boolean);
    return {
      seeded: Boolean(siteDoc),
      loaded: site.loaded && communities.loaded,
      site: normSite(siteDoc) as SiteSettings,
      communities: comms,
      events: events.rows, team: team.rows, mentors: mentors.rows, partners: partners.rows, faqs: faqs.rows,
      problems: problems.rows, questions: questions.rows, collabs: collabs.rows, registrations: registrations.rows,
      error: errors[0] || "",
    } as AdminData;
  }, [site, communities, events, team, mentors, partners, faqs, problems, questions, collabs, registrations]);
}

function Login({ auth }: { auth: ReturnType<typeof useAdminAuth> }) {
  const [role, setRole] = useState<"super" | CommunityId>("super");
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5" style={{ ["--accent" as string]: "#6366F1", ["--on-accent" as string]: "#fff" }}>
      <div className="aurora" aria-hidden="true" />
      <div className="bg-grid absolute inset-0" aria-hidden="true" />
      <main className="card relative w-full max-w-md p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent-text"><Icon name="shield" size={22} /></span>
        <h1 className="mt-6 font-display text-3xl font-semibold">Admin paneli</h1>
        <p className="mt-2 text-sm text-muted">BMU icmalarının ortaq saytını kodsuz idarə et: loqolar, rənglər, mətnlər, tədbirlər, komanda, Problem Bank və s.</p>
        {MODE === "firebase" ? (
          <>
            <button className="btn btn-primary mt-8 w-full" onClick={auth.signIn}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
              Google ilə daxil ol
            </button>
            <p className="mt-4 text-xs text-faint">Yalnız admin siyahısındakı e-poçtlar daxil ola bilər.</p>
          </>
        ) : (
          <div className="mt-8 grid gap-3">
            <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200 light:text-amber-800">
              <b>Demo rejimi.</b> Firebase qoşulmayıb, ona görə dəyişikliklər yalnız bu brauzerdə saxlanır. Real istifadə üçün README-dəki Firebase addımlarını et.
            </div>
            <label className="field">
              <span className="label">Demo rol</span>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                <option value="super">Baş admin (hamısı)</option>
                {COMMUNITY_IDS.map((id) => <option key={id} value={id}>{id} icma admini</option>)}
              </select>
            </label>
            <button className="btn btn-primary w-full" onClick={() => auth.demoSignIn(role)}>Demo admin kimi daxil ol</button>
          </div>
        )}
        {auth.error && <p className="mt-4 text-sm text-danger" role="alert">{auth.error}</p>}
        <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm text-muted hover:text-fg"><Icon name="arrowLeft" size={14} /> Sayta qayıt</Link>
      </main>
    </div>
  );
}

export function AdminApp() {
  const auth = useAdminAuth();
  const me = auth.me;
  const data = useAdminData(me);
  const [tab, setTab] = useState<Tab>("dashboard");
  useEffect(() => {
    const sync = () => {
      const h = location.hash.slice(1) as Tab;
      if (NAV.some((n) => n.k === h)) setTab(h);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const go = (k: Tab) => {
    setTab(k);
    history.replaceState(null, "", `#${k}`);
    window.scrollTo({ top: 0 });
  };
  const accent = data.site.accent || "#6366F1";
  const style = { ["--accent" as string]: accent, ["--on-accent" as string]: onColor(accent) } as React.CSSProperties;

  if (auth.loading) return <div className="grid min-h-dvh place-items-center text-muted">Yüklənir…</div>;
  if (!me) return <Login auth={auth} />;

  const pending = data.problems.filter((p) => (p as { status?: string }).status === "pending").length;
  const unanswered = [...data.questions, ...data.collabs].filter((q) => !(q as { answered?: boolean }).answered).length;
  const nav = NAV.filter((n) => !("superOnly" in n) || me.role === "super");

  return (
    <div className="min-h-dvh" style={style}>
      <div className="flex">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-bg2/60 p-4 lg:flex">
          <Link href="/" className="mb-6 flex items-center gap-2 px-2 font-display font-semibold" target="_blank">
            <span className="grid h-9 w-9 grid-cols-2 gap-[3px] rounded-[11px] border border-line2 p-[6px]">
              {COMMUNITY_IDS.map((id) => <span key={id} className="rounded-[3px]" style={{ background: data.communities[id].accent }} />)}
            </span>
            Admin
          </Link>
          <nav className="flex-1 space-y-0.5 overflow-y-auto" aria-label="Admin">
            {nav.map((n) => (
              <button key={n.k} onClick={() => go(n.k)} aria-current={tab === n.k ? "page" : undefined}
                className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors", tab === n.k ? "bg-accent/15 font-semibold text-accent-text" : "text-muted hover:bg-surface2 hover:text-fg")}>
                <Icon name={n.icon} size={17} />
                <span className="flex-1">{n.label}</span>
                {n.k === "problems" && pending > 0 && <span className="rounded-full bg-accent px-2 text-xs text-on-accent">{pending}</span>}
                {n.k === "inbox" && unanswered > 0 && <span className="rounded-full bg-accent px-2 text-xs text-on-accent">{unanswered}</span>}
              </button>
            ))}
          </nav>
          <UserBox me={me} onOut={auth.signOut} />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-display font-semibold">Admin paneli</span>
              <button className="btn btn-ghost btn-sm" onClick={auth.signOut}><Icon name="logout" size={14} /> Çıxış</button>
            </div>
            <nav className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-3" aria-label="Admin">
              {nav.map((n) => (
                <button key={n.k} onClick={() => go(n.k)} className="chip shrink-0" aria-pressed={tab === n.k}><Icon name={n.icon} size={14} /> {n.label}</button>
              ))}
            </nav>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
            {MODE === "demo" && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm">
                <Icon name="sparkle" size={18} className="mt-0.5 shrink-0 text-amber-300" />
                <p><b>Demo rejimi:</b> dəyişikliklər yalnız bu brauzerdə saxlanır və sayt bu brauzerdə dərhal yenilənir. Firebase qoşulanda hamı üçün işləyəcək.</p>
              </div>
            )}
            {data.error && (
              <div className="mb-6 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm" role="alert">
                <b>Firestore xətası:</b> {data.error}. Çox güman Firestore qaydaları (firestore.rules) hələ yenilənməyib. README-dəki addımlara bax.
              </div>
            )}
            {tab === "dashboard" && <DashboardPanel me={me} data={data} go={(k) => go(k as Tab)} />}
            {tab === "brand" && <BrandPanel me={me} data={data} />}
            {tab === "texts" && <TextsPanel me={me} data={data} />}
            {tab === "info" && <InfoPanel me={me} data={data} />}
            {(tab === "events" || tab === "team" || tab === "mentors" || tab === "partners" || tab === "faqs") && <CollectionsPanel key={tab} kind={tab} me={me} data={data} />}
            {tab === "problems" && <ProblemsPanel me={me} data={data} />}
            {tab === "inbox" && <InboxPanel me={me} data={data} />}
            {tab === "qr" && <QrPanel me={me} data={data} />}
            {tab === "admins" && me.role === "super" && <AdminsPanel me={me} />}
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

function UserBox({ me, onOut }: { me: Me; onOut: () => void }) {
  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface2 p-3">
      <div className="flex items-center gap-3">
        {me.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.photo} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" />
        ) : <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/20 text-accent-text"><Icon name="shield" size={16} /></span>}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{me.name}</p>
          <p className="truncate text-xs text-faint">{me.role === "super" ? "Baş admin" : `${me.community} admini`}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link href="/" target="_blank" className="btn btn-ghost btn-sm flex-1"><Icon name="external" size={14} /> Sayt</Link>
        <button className="btn btn-ghost btn-sm flex-1" onClick={onOut}><Icon name="logout" size={14} /> Çıxış</button>
      </div>
    </div>
  );
}
