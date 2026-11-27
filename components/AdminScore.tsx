"use client";
// Aktivlik reytinqi (admin): bütün mənbələrdən siqnal yığır, lib/score.ts ilə aylıq balı hesablayır,
// ayın qalibini göstərir və nəticəni `scores/{YYYY-MM}` arxivinə yazır. Xam data heç vaxt silinmir.
import { Fragment, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { collection, getDocs, limit, query, Timestamp, where } from "firebase/firestore";
import { fb } from "@/lib/firebase";
import { addRecord, listRecords, setRecord, toDate, type Rec } from "@/lib/store";
import { bakuParts } from "@/lib/track";
import {
  aliasKey, BONUS_MAX, CHANNELS, computeMonth, makeMatcher, manualSignals, mergeImports, parseRoster, parseWhatsapp,
  STREAK_MULT, whatsappSignals, type MemberScore, type RosterRow, type Signal,
} from "@/lib/score";

const AZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
const monthName = (m: string) => `${AZ_MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
const thisMonth = () => bakuParts(new Date()).day.slice(0, 7);
const shiftMonth = (m: string, d: number) => { const [y, mo] = m.split("-").map(Number); const t = new Date(Date.UTC(y, mo - 1 + d, 1)); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`; };
// Bakı vaxtı ilə ayın sərhədləri (UTC+4).
const monthStart = (m: string) => { const [y, mo] = m.split("-").map(Number); return Date.UTC(y, mo - 1, 1) - 4 * 36e5; };
const CHUNK = 2500; // bir import sənədində maksimum siqnal (Firestore sənədi 1 MB-dan kiçik qalsın)

function download(name: string, text: string, type = "text/csv") {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + text], { type })); a.download = name; a.click();
}
const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsText(f, "utf-8"); });

type Data = { roster: RosterRow[]; aliases: Map<string, string>; imports: Rec[]; users: Rec[]; events: Rec[]; checkins: Rec[]; sessions: Rec[]; archive: Rec[] };

async function loadSiteEvents(fromMs: number, toMs: number): Promise<Rec[]> {
  const f = fb(); if (!f) return [];
  const s = await getDocs(query(collection(f.db, "events"), where("createdAt", ">=", Timestamp.fromMillis(fromMs)), where("createdAt", "<", Timestamp.fromMillis(toMs)), limit(30000)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function loadAll(month: string): Promise<Data> {
  const safe = (p: Promise<Rec[]>) => p.catch(() => [] as Rec[]);
  const prev = shiftMonth(month, -1), next = shiftMonth(month, 1);
  const [roster, aliases, imports, users, events, checkins, sessions, archive] = await Promise.all([
    safe(listRecords("roster")), safe(listRecords("aliases")), safe(listRecords("imports")), safe(listRecords("users")),
    loadSiteEvents(monthStart(prev), monthStart(next)).catch(() => [] as Rec[]), safe(listRecords("checkins")), safe(listRecords("sessions")), safe(listRecords("scores")),
  ]);
  return {
    roster: roster as unknown as RosterRow[], aliases: new Map(aliases.map((a) => [a.id, String(a.email)])), imports, users, events, checkins, sessions, archive,
  };
}

/** Bütün mənbələri siqnala çevirir: importlar (WhatsApp, sosial, əl ilə), sayt hadisələri, QR check-in, dəvətlər. */
function buildSignals(d: Data): Signal[] {
  const byUid = new Map(d.users.map((u) => [u.id, u]));
  const emailOf = (uid?: unknown) => { const u = uid ? byUid.get(String(uid)) : null; return u?.email ? String(u.email).toLowerCase() : null; };
  const imported = mergeImports(d.imports.filter((i) => i.active !== false).map((i) => (i.signals as Signal[]) || []));

  // Sayt: hər aktiv gün, çatbot sualı, səhifə baxışı, tədbirə qeydiyyat, form, qiymət.
  const site = new Map<string, Signal>();
  const add = (member: string, day: string, channel: Signal["channel"], kind: string, n = 1, once = false) => {
    const k = `${member}|${day}|${kind}`; const o = site.get(k);
    if (o) { if (!once) o.n += n; } else site.set(k, { member, day, channel, kind, n, source: "sayt" });
  };
  for (const e of d.events) {
    const m = emailOf(e.uid); const day = String(e.day || ""); if (!m || !day) continue;
    add(m, day, "web", "web_day", 1, true);
    if (e.type === "page_view") add(m, day, "web", "page_view");
    else if (e.type === "chat_question") add(m, day, "web", "chat");
    else if (e.type === "event_register") add(m, day, "events", "register");
    else if (e.type === "form_submit") add(m, day, "contrib", e.label === "feedback" ? "feedback" : "form");
    else if (e.type === "rating") add(m, day, "contrib", "feedback");
  }

  // QR check-in: tədbir və dərs. Başlamadan 10 dəq. sonraya qədər gələn "vaxtında" sayılır.
  const sess = new Map(d.sessions.map((s) => [s.id, s]));
  const ci: Signal[] = [];
  for (const c of d.checkins) {
    const s = sess.get(String(c.code)); if (!s) continue;
    const m = String(c.email || emailOf(c.uid) || "").toLowerCase(); if (!m) continue;
    const day = String(s.day); const lesson = s.kind === "lesson";
    ci.push({ member: m, day, channel: lesson ? "lessons" : "events", kind: lesson ? "lesson" : "checkin", n: 1, source: "check-in" });
    const at = toDate(c.updatedAt) || toDate(c.at); const start = s.start ? new Date(`${day}T${s.start}:00+04:00`) : null;
    if (!lesson && at && start && at.getTime() <= start.getTime() + 10 * 6e4) ci.push({ member: m, day, channel: "events", kind: "ontime", n: 1, source: "check-in" });
  }

  const all = [...imported, ...site.values(), ...ci];

  // Dəvət: dəvət etdiyi üzv həmin ay aktiv olubsa, dəvət edənə +10 (üzvün ayın ilk aktiv günü).
  const firstDay = new Map<string, string>();
  for (const s of all) { const k = `${s.member}|${s.day.slice(0, 7)}`; const o = firstDay.get(k); if (!o || s.day < o) firstDay.set(k, s.day); }
  const byRef = new Map(d.users.filter((u) => u.refCode).map((u) => [String(u.refCode), u]));
  for (const u of d.users) {
    const ref = u.referredBy ? byRef.get(String(u.referredBy)) : null; const me = emailOf(u.id); const them = ref ? emailOf(ref.id) : null;
    if (!me || !them || me === them) continue;
    for (const [k, day] of firstDay) if (k.startsWith(me + "|")) all.push({ member: them, day, channel: "referral", kind: "referral_active", n: 1, source: "dəvət" });
  }
  return all;
}

/* ============================ Reytinq ============================ */
export function ScoreTab() {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState<Data | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"rank" | "import" | "checkin" | "history" | "how">("rank");
  const [msg, setMsg] = useState("");
  // Yeniləmədə köhnə data ekranda qalır ki, açıq bölmə (məs. QR) itməsin; yalnız ay dəyişəndə sıfırlanır.
  const reload = () => { loadAll(month).then(setData).catch((e) => { setMsg("Yükləmə xətası: " + (e as Error).message); }); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setData(null); reload(); }, [month]);

  const calc = useMemo(() => {
    if (!data) return null;
    const signals = buildSignals(data);
    const names = new Map<string, string>();
    for (const u of data.users) if (u.email) names.set(String(u.email).toLowerCase(), String(u.name || u.email));
    for (const r of data.roster) if (r.email) names.set(r.email, r.name || r.email);
    const now = computeMonth(month, signals, names), prev = computeMonth(shiftMonth(month, -1), signals, names);
    const prevMap = new Map(prev.map((p) => [p.member, p]));
    const nowMap = new Map(now.map((p) => [p.member, p]));
    const fading = prev.filter((p) => p.total >= 15 && (nowMap.get(p.member)?.total || 0) < p.total * 0.5)
      .map((p) => ({ ...p, nowTotal: nowMap.get(p.member)?.total || 0 }));
    const inactive = data.roster.filter((r) => !nowMap.has(r.email));
    const sources = new Map<string, number>(); for (const s of signals) if (s.day.startsWith(month)) sources.set(s.source, (sources.get(s.source) || 0) + 1);
    return { now, prevMap, fading, inactive, signals, sources, names };
  }, [data, month]);

  const archive = async () => {
    if (!calc) return;
    const ranking = calc.now.slice(0, 400).map((r, i) => ({ rank: i + 1, member: r.member, name: r.name, total: r.total, base: r.base, bonus: r.bonus, streak: r.streak,
      activeDays: r.activeDays, ch: Object.fromEntries(CHANNELS.map((c) => [c.id, r.channels[c.id].pts])) }));
    await setRecord("scores", month, { month, ranking, winner: ranking[0] || null, members: calc.now.length, computedAt: new Date().toISOString(), rules: { channels: CHANNELS.map(({ id, weight, target }) => ({ id, weight, target })), STREAK_MULT, BONUS_MAX } });
    setMsg(`${monthName(month)} arxivləndi. Xam data yerində qalır, istənilən vaxt yenidən hesablamaq olar.`); reload();
  };

  const exportCsv = () => {
    if (!calc) return;
    const cols = ["Yer", "Ad", "E-poçt", "Bal", "Əsas", "Həftəlik bonus", "GitHub/Kaggle", "Aktiv gün", "Aktiv həftə", ...CHANNELS.map((c) => c.az)];
    download(`datatech-reytinq-${month}.csv`, [cols.map(q).join(","), ...calc.now.map((r, i) => [i + 1, r.name, r.member, r.total, r.base, r.streak ? "bəli" : "", r.bonus, r.activeDays, r.activeWeeks, ...CHANNELS.map((c) => r.channels[c.id].pts)].map(q).join(","))].join("\n"));
  };

  const months = Array.from({ length: 13 }, (_, i) => shiftMonth(thisMonth(), -i));
  const archived = data?.archive.find((a) => a.id === month);

  return (
    <div className="stack">
      <div className="a-bar">
        <select className="input" value={month} onChange={(e) => setMonth(e.target.value)} style={{ maxWidth: 200 }}>
          {months.map((m) => <option key={m} value={m}>{monthName(m)}</option>)}
        </select>
        <div className="seg">
          {([["rank", "Reytinq"], ["import", "Data yüklə"], ["checkin", "QR check-in"], ["history", "Arxiv"], ["how", "Necə hesablanır"]] as const).map(([k, v]) =>
            <button key={k} type="button" className={view === k ? "on" : ""} onClick={() => setView(k)}>{v}</button>)}
        </div>
        <button className="btn sec sm" type="button" onClick={reload}>Yenilə</button>
      </div>
      {msg && <div className="banner" onClick={() => setMsg("")}>{msg}</div>}
      {!data || !calc ? <p className="note">Yüklənir…</p> : (
        <>
          {view === "rank" && <Ranking month={month} calc={calc} open={open} setOpen={setOpen} onArchive={archive} onCsv={exportCsv} archivedAt={archived ? toDate(archived.computedAt) : null} />}
          {view === "import" && <ImportPanel data={data} onSaved={(t) => { setMsg(t); reload(); }} />}
          {view === "checkin" && <CheckinPanel data={data} onSaved={reload} />}
          {view === "history" && <History archive={data.archive} />}
          {view === "how" && <How />}
        </>
      )}
    </div>
  );
}

type Calc = { now: MemberScore[]; prevMap: Map<string, MemberScore>; fading: (MemberScore & { nowTotal: number })[]; inactive: RosterRow[]; sources: Map<string, number>; signals: Signal[] };

function Ranking({ month, calc, open, setOpen, onArchive, onCsv, archivedAt }: { month: string; calc: Calc; open: string | null; setOpen: (s: string | null) => void; onArchive: () => void; onCsv: () => void; archivedAt: Date | null }) {
  const top = calc.now.slice(0, 3);
  const total = calc.now.length;
  const avg = total ? Math.round((calc.now.reduce((s, r) => s + r.total, 0) / total) * 10) / 10 : 0;
  return (
    <div className="stack">
      <div className="a-kpis">
        <div className="panel kpi a-kpi"><span className="lbl">Bal alan üzv</span><div className="num">{total}</div></div>
        <div className="panel kpi a-kpi"><span className="lbl">Orta bal</span><div className="num">{avg}</div></div>
        <div className="panel kpi a-kpi"><span className="lbl">Bu ay aktiv olmayan (siyahıda)</span><div className="num">{calc.inactive.length}</div></div>
        <div className="panel kpi a-kpi"><span className="lbl">Sönən üzv</span><div className="num">{calc.fading.length}</div></div>
      </div>

      <section className="panel box a-card">
        <h3>{monthName(month)}: ayın qalibi</h3>
        {!top.length ? <p className="note">Bu ay üçün hələ data yoxdur. &quot;Data yüklə&quot; bölməsindən üzv siyahısını və WhatsApp ixracını əlavə et.</p> : (
          <div className="sc-podium">
            {top.map((r, i) => (
              <div key={r.member} className={"sc-pod p" + (i + 1)}>
                <span className="sc-place">{i + 1}</span>
                <b>{r.name}</b>
                <span className="num sc-total">{r.total}</span>
                <span className="note">{bestChannels(r)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="note">Rəsmi qalib 1-ci yerdir. İstəsən ilk 3 nəfəri də mükafatlandıra bilərsən.</p>
      </section>

      <section className="panel box a-card">
        <h3>Tam reytinq
          <span style={{ display: "flex", gap: 8 }}>
            <button className="btn sec sm" type="button" onClick={onCsv}>CSV</button>
            <button className="btn sm" type="button" onClick={onArchive} title="Nəticəni aylıq arxivə yazır (silinmir)">{archivedAt ? "Arxivi yenilə" : "Ayı arxivlə"}</button>
          </span>
        </h3>
        {archivedAt && <p className="note">Son arxiv: {archivedAt.toLocaleString("az", { timeZone: "Asia/Baku" })}</p>}
        <div className="tablewrap"><table className="table sc-table">
          <thead><tr><th>#</th><th>Üzv</th><th>Bal</th><th title="Keçən ayla müqayisə">±</th>{CHANNELS.map((c) => <th key={c.id} title={`${c.az} (maks. ${c.weight})`}>{c.az.split(" ")[0]}</th>)}<th title={`GitHub/Kaggle, maks. +${BONUS_MAX}`}>Bonus</th><th title={`Ayın hər həftəsi aktiv: ×${STREAK_MULT}`}>Hər həftə</th><th>Gün</th></tr></thead>
          <tbody>{calc.now.map((r, i) => {
            const p = calc.prevMap.get(r.member); const d = p ? Math.round((r.total - p.total) * 10) / 10 : null;
            return (
              <Fragment key={r.member}>
                <tr onClick={() => setOpen(open === r.member ? null : r.member)} style={{ cursor: "pointer" }} className={i < 3 ? "sc-top" : ""}>
                  <td className="num">{i + 1}</td><td>{r.name}<br /><span className="note">{r.member}</span></td>
                  <td className="num"><b>{r.total}</b></td>
                  <td className={"num " + (d == null ? "" : d > 0 ? "up" : d < 0 ? "down" : "")}>{d == null ? "yeni" : (d > 0 ? "+" : "") + d}</td>
                  {CHANNELS.map((c) => <td key={c.id} className="num"><span className="sc-cell" style={{ ["--f" as string]: r.channels[c.id].pts / c.weight }}>{r.channels[c.id].pts || ""}</span></td>)}
                  <td className="num">{r.bonus || ""}</td><td>{r.streak ? "✓" : `${r.activeWeeks} h.`}</td><td className="num">{r.activeDays}</td>
                </tr>
                {open === r.member && <tr><td colSpan={CHANNELS.length + 7}><MemberDetail r={r} signals={calc.signals.filter((s) => s.member === r.member && s.day.startsWith(month))} /></td></tr>}
              </Fragment>
            );
          })}</tbody>
        </table></div>
      </section>

      <div className="a-grid2">
        <section className="panel box a-card"><h3>Sönən üzvlər</h3>
          <p className="note">Keçən ay ən azı 15 bal alıb, bu ay yarıdan çox düşənlər. Onlara şəxsən yazmaq yaxşıdır.</p>
          {!calc.fading.length ? <p className="note">Yoxdur.</p> : <div className="list">{calc.fading.slice(0, 30).map((r) => <div key={r.member} className="row"><div className="grow">{r.name}</div><span className="num">{r.total} → {r.nowTotal}</span></div>)}</div>}
        </section>
        <section className="panel box a-card"><h3>Bu ayın data mənbələri</h3>
          {!calc.sources.size ? <p className="note">Hələ heç nə.</p> : <div className="list">{[...calc.sources.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => <div key={k} className="row"><div className="grow">{k}</div><span className="num">{v} qeyd</span></div>)}</div>}
          {calc.inactive.length > 0 && <><h4 style={{ margin: "14px 0 6px" }}>Bu ay heç bir izi olmayanlar ({calc.inactive.length})</h4>
            <p className="note">{calc.inactive.slice(0, 60).map((r) => r.name || r.email).join(", ")}{calc.inactive.length > 60 ? "…" : ""}</p></>}
        </section>
      </div>
    </div>
  );
}

function bestChannels(r: MemberScore) {
  return CHANNELS.map((c) => [c.az, r.channels[c.id].pts / c.weight] as const).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]).join(", ");
}

function MemberDetail({ r, signals }: { r: MemberScore; signals: Signal[] }) {
  const byKind = new Map<string, number>(); for (const s of signals) byKind.set(`${s.source}: ${s.kind}`, (byKind.get(`${s.source}: ${s.kind}`) || 0) + s.n);
  return (
    <div className="a-grid2">
      <div className="a-hbars">{CHANNELS.map((c) => (
        <div key={c.id} className="a-hbar" title={c.how}>
          <span className="k">{c.az}</span><span className="bar"><i style={{ width: `${(r.channels[c.id].pts / c.weight) * 100}%` }} /></span>
          <span className="v num">{r.channels[c.id].pts}/{c.weight}</span>
        </div>
      ))}
        <p className="note">Əsas {r.base} {r.streak ? `× ${STREAK_MULT} (hər həftə aktiv)` : ""} + bonus {r.bonus} = <b>{r.total}</b></p>
      </div>
      <div className="list a-scroll">{[...byKind.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => <div key={k} className="row"><div className="grow">{k}</div><span className="num">{Math.round(v * 10) / 10}</span></div>)}</div>
    </div>
  );
}

/* ============================ Data yükləmə ============================ */
type Preview = { kind: "whatsapp" | "manual"; file: string; signals: Signal[]; unknown: [string, number][]; messages?: number; days?: [string, string] };

function ImportPanel({ data, onSaved }: { data: Data; onSaved: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [pre, setPre] = useState<Preview | null>(null);
  const [raw, setRaw] = useState<{ kind: Preview["kind"]; file: string; text: string } | null>(null);
  const [alias, setAlias] = useState<Record<string, string>>({});
  const [aliases, setAliases] = useState(data.aliases);
  const matcher = useMemo(() => makeMatcher(data.roster, aliases), [data.roster, aliases]);

  const analyse = (kind: Preview["kind"], file: string, text: string) => {
    if (kind === "whatsapp") {
      const msgs = parseWhatsapp(text); const r = whatsappSignals(msgs, matcher);
      const days = msgs.map((m) => m.day).sort();
      setPre({ kind, file, signals: r.signals, unknown: r.unknown, messages: msgs.length, days: [days[0], days[days.length - 1]] });
    } else {
      const r = manualSignals(text, matcher); const u = new Map<string, number>(); for (const x of r.unknown) u.set(x, (u.get(x) || 0) + 1);
      setPre({ kind, file, signals: r.signals, unknown: [...u.entries()] });
    }
  };
  // Bağlamalar dəyişəndə önbaxışı yenidən hesabla.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (raw) analyse(raw.kind, raw.file, raw.text); }, [matcher]);

  const onFile = async (kind: "roster" | Preview["kind"], f?: File) => {
    if (!f) return; const text = await readFile(f);
    if (kind === "roster") {
      const rows = parseRoster(text);
      if (!rows.length) { onSaved("Cədvəldə BMU e-poçtu olan sətir tapılmadı. Google Sheet-də Fayl → Yüklə → CSV seç."); return; }
      setBusy(true);
      for (const r of rows) await setRecord("roster", r.email, { ...r });
      setBusy(false); onSaved(`${rows.length} üzv siyahıya yazıldı (köhnələr yeniləndi, heç kim silinmədi).`); return;
    }
    setRaw({ kind, file: f.name, text }); analyse(kind, f.name, text);
  };

  const saveAliases = async () => {
    const next = new Map(aliases);
    for (const [sender, email] of Object.entries(alias)) {
      const e = email.trim().toLowerCase(); if (!e) continue;
      await setRecord("aliases", aliasKey(sender), { sender, email: e }); next.set(aliasKey(sender), e);
    }
    setAlias({}); setAliases(next);
  };

  const save = async () => {
    if (!pre) return; setBusy(true);
    const parts = Math.max(1, Math.ceil(pre.signals.length / CHUNK));
    for (let i = 0; i < parts; i++) {
      await addRecord("imports", { source: pre.kind, file: pre.file, part: i + 1, parts, active: true, count: pre.signals.length,
        from: pre.days?.[0] || "", to: pre.days?.[1] || "", unknown: pre.unknown.slice(0, 200).map(([k, v]) => `${k} (${v})`), signals: pre.signals.slice(i * CHUNK, (i + 1) * CHUNK) });
    }
    setBusy(false); setPre(null); setRaw(null);
    onSaved(`Yükləndi: ${pre.file}. Eyni faylı (və ya daha uzun ixracı) yenidən yükləsən, xal ikiqat artmır.`);
  };

  const toggle = async (i: Rec) => { await setRecord("imports", i.id, { active: i.active === false }); onSaved(i.active === false ? "Import yenidən aktivdir." : "Import hesablamadan çıxarıldı (silinmədi)."); };

  const template = () => download("datatech-sosial-numune.csv",
    "tarix,platforma,kim,hərəkət,say\n2026-12-03,instagram,@istifadeci,comment,1\n2026-12-03,tiktok,@istifadeci,share,1\n2026-12-04,linkedin,ad-soyad,repost,1\n2026-12-05,tədbir,ad.soyad@std.beu.edu.az,checkin,1\n2026-12-06,dərs,ad.soyad@std.beu.edu.az,homework,1\n2026-12-07,töhfə,ad.soyad@std.beu.edu.az,project,1\n2026-12-08,github,istifadeci,commit,3\n");

  return (
    <div className="stack">
      <div className="a-grid2">
        <section className="panel box a-card"><h3>1. Üzv siyahısı</h3>
          <p className="note">Google Form cədvəli: Fayl → Yüklə → CSV. Hazırda siyahıda <b>{data.roster.length}</b> üzv var. Hər yükləmədə yenilənir, heç kim silinmir.</p>
          <input type="file" accept=".csv,text/csv" disabled={busy} onChange={(e) => { onFile("roster", e.target.files?.[0]); e.target.value = ""; }} />
        </section>
        <section className="panel box a-card"><h3>2. WhatsApp söhbət qrupu</h3>
          <p className="note">Yalnız hamının yaza bildiyi söhbət qrupu. Qrup → ⋮ → Daha çox → Söhbəti ixrac et → <b>Mediasız</b>. .txt faylını bura at (zip-dirsə, aç).</p>
          <input type="file" accept=".txt,text/plain" disabled={busy || !data.roster.length} onChange={(e) => { onFile("whatsapp", e.target.files?.[0]); e.target.value = ""; }} />
          {!data.roster.length && <p className="note">Əvvəlcə üzv siyahısını yüklə.</p>}
        </section>
        <section className="panel box a-card"><h3>3. Sosial media, tədbir, dərs, töhfə</h3>
          <p className="note">Tariel və komanda həftəlik cədvəl doldurur: tarix, platforma, kim, hərəkət, say. <button type="button" className="linkbtn" onClick={template}>Nümunə CSV yüklə</button></p>
          <input type="file" accept=".csv,text/csv" disabled={busy || !data.roster.length} onChange={(e) => { onFile("manual", e.target.files?.[0]); e.target.value = ""; }} />
        </section>
        <section className="panel box a-card"><h3>Avtomatik gələnlər</h3>
          <p className="note">Bunları heç nə yükləmədən özüm götürürəm: sayt (aktiv gün, çatbot, tədbirə yazılma, formlar, qiymətlər), QR check-in (tədbir və dərs) və dəvət linkləri.</p>
        </section>
      </div>

      {pre && (
        <section className="panel box a-card"><h3>Önbaxış: {pre.file}</h3>
          <p className="note">
            {pre.messages != null && <>{pre.messages} mesaj ({pre.days?.[0]} – {pre.days?.[1]}). </>}
            Tanınan: <b>{new Set(pre.signals.map((s) => s.member)).size}</b> üzv, {pre.signals.length} qeyd. Tanınmayan: <b>{pre.unknown.length}</b>.
          </p>
          {pre.unknown.length > 0 && (
            <>
              <p className="note">Tanınmayanları əl ilə bağla (e-poçt yaz). Bağlama yadda qalır, növbəti dəfə avtomatik tanınacaq.</p>
              <datalist id="dt-roster">{data.roster.map((r) => <option key={r.email} value={r.email}>{r.name}</option>)}</datalist>
              <div className="list a-scroll">{pre.unknown.slice(0, 60).map(([k, v]) => (
                <div key={k} className="row"><div className="grow">{k} <span className="muted">({v})</span></div>
                  <input className="input" list="dt-roster" placeholder="e-poçt" value={alias[k] || ""} onChange={(e) => setAlias({ ...alias, [k]: e.target.value })} style={{ maxWidth: 280 }} /></div>
              ))}</div>
              <button className="btn sec sm" type="button" onClick={saveAliases} disabled={!Object.values(alias).some(Boolean)}>Bağlamaları saxla</button>
            </>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" type="button" disabled={busy || !pre.signals.length} onClick={save}>{busy ? "Yazılır…" : "Yadda saxla"}</button>
            <button className="btn sec" type="button" onClick={() => { setPre(null); setRaw(null); }}>Ləğv et</button>
          </div>
        </section>
      )}

      <section className="panel box a-card"><h3>Yüklənmiş fayllar</h3>
        {!data.imports.length ? <p className="note">Hələ heç nə yüklənməyib.</p> : (
          <div className="tablewrap"><table className="table"><thead><tr><th>Tarix</th><th>Mənbə</th><th>Fayl</th><th>Dövr</th><th>Qeyd</th><th>Tanınmayan</th><th></th></tr></thead>
            <tbody>{[...data.imports].sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)).map((i) => (
              <tr key={i.id} style={{ opacity: i.active === false ? 0.5 : 1 }}>
                <td>{toDate(i.createdAt)?.toLocaleString("az", { timeZone: "Asia/Baku" })}</td><td>{String(i.source)}</td>
                <td>{String(i.file)}{Number(i.parts) > 1 ? ` (${i.part}/${i.parts})` : ""}</td><td>{i.from ? `${i.from} – ${i.to}` : ""}</td>
                <td className="num">{((i.signals as Signal[]) || []).length}</td><td className="num">{((i.unknown as string[]) || []).length}</td>
                <td><button className="btn sec sm" type="button" onClick={() => toggle(i)}>{i.active === false ? "Qaytar" : "Hesablamadan çıxar"}</button></td>
              </tr>
            ))}</tbody></table></div>
        )}
        <p className="note">Heç bir fayl silinmir. Səhv yükləməni &quot;hesablamadan çıxar&quot;, data arxivdə qalır.</p>
      </section>
    </div>
  );
}

/* ============================ QR check-in ============================ */
function CheckinPanel({ data, onSaved }: { data: Data; onSaved: () => void }) {
  const [f, setF] = useState({ title: "", kind: "event", day: bakuParts(new Date()).day, start: "18:00" });
  const [qr, setQr] = useState<{ code: string; img: string } | null>(null);
  const counts = useMemo(() => { const m = new Map<string, number>(); for (const c of data.checkins) m.set(String(c.code), (m.get(String(c.code)) || 0) + 1); return m; }, [data.checkins]);
  const show = async (code: string) => setQr({ code, img: await QRCode.toDataURL(`${location.origin}/c/${code}`, { width: 900, margin: 2, errorCorrectionLevel: "M", color: { dark: "#0b1f4d", light: "#ffffff" } }) });
  const create = async () => {
    if (!f.title.trim()) return;
    const code = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
    await setRecord("sessions", code, { ...f, title: f.title.trim(), open: true });
    setF({ ...f, title: "" }); await show(code); onSaved();
  };
  const toggle = async (s: Rec) => { await setRecord("sessions", s.id, { open: !s.open }); onSaved(); };
  const sessions = [...data.sessions].sort((a, b) => String(b.day).localeCompare(String(a.day)));
  return (
    <div className="stack">
      <section className="panel box a-card"><h3>Yeni check-in QR</h3>
        <p className="note">Hər tədbir və dərs üçün QR yarat, ekranda göstər. Üzv BMU hesabı ilə skan edir, iştirakı avtomatik yazılır. Başlamadan 10 dəqiqə sonraya qədər gələn tədbirdə &quot;vaxtında&quot; bonusu alır.</p>
        <div className="a-bar" style={{ flexWrap: "wrap" }}>
          <input className="input" placeholder="Ad: məs. Python dərsi 3" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} style={{ maxWidth: 280 }} />
          <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} style={{ maxWidth: 140 }}><option value="event">Tədbir</option><option value="lesson">Dərs</option></select>
          <input className="input" type="date" value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })} style={{ maxWidth: 170 }} />
          <input className="input" type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} style={{ maxWidth: 120 }} />
          <button className="btn" type="button" onClick={create} disabled={!f.title.trim()}>QR yarat</button>
        </div>
        {qr && <div style={{ textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.img} alt="Check-in QR" style={{ width: 280, maxWidth: "100%", borderRadius: 12 }} />
          <p className="note">{location.origin}/c/{qr.code}</p>
          <a className="btn sec sm" href={qr.img} download={`checkin-${qr.code}.png`}>PNG yüklə</a>
        </div>}
      </section>
      <section className="panel box a-card"><h3>Check-in-lər</h3>
        {!sessions.length ? <p className="note">Hələ yoxdur.</p> : (
          <div className="tablewrap"><table className="table"><thead><tr><th>Tarix</th><th>Ad</th><th>Növ</th><th>Gələn</th><th>Vəziyyət</th><th></th></tr></thead>
            <tbody>{sessions.map((s) => (
              <tr key={s.id}><td>{String(s.day)} {String(s.start || "")}</td><td>{String(s.title)}</td><td>{s.kind === "lesson" ? "Dərs" : "Tədbir"}</td>
                <td className="num">{counts.get(s.id) || 0}</td><td>{s.open ? "Açıq" : "Bağlı"}</td>
                <td style={{ display: "flex", gap: 6 }}><button className="btn sec sm" type="button" onClick={() => show(s.id)}>QR</button><button className="btn sec sm" type="button" onClick={() => toggle(s)}>{s.open ? "Bağla" : "Aç"}</button></td></tr>
            ))}</tbody></table></div>
        )}
        <p className="note">Tədbir bitəndə check-in-i bağla ki, sonradan link paylaşılıb skan edilməsin.</p>
      </section>
    </div>
  );
}

/* ============================ Arxiv ============================ */
function History({ archive }: { archive: Rec[] }) {
  const months = [...archive].sort((a, b) => b.id.localeCompare(a.id));
  const year = useMemo(() => {
    const m = new Map<string, { name: string; sum: number; months: number; wins: number }>();
    for (const a of archive) for (const r of (a.ranking as { member: string; name: string; total: number; rank: number }[]) || []) {
      const o = m.get(r.member) || { name: r.name, sum: 0, months: 0, wins: 0 }; o.sum += r.total; o.months++; if (r.rank === 1) o.wins++; m.set(r.member, o);
    }
    return [...m.entries()].sort((a, b) => b[1].sum - a[1].sum).slice(0, 20);
  }, [archive]);
  if (!months.length) return <p className="note">Arxiv boşdur. Ayın sonunda &quot;Ayı arxivlə&quot; düyməsini bas. Arxiv heç vaxt silinmir.</p>;
  return (
    <div className="a-grid2">
      <section className="panel box a-card"><h3>Aylar</h3>
        <div className="list">{months.map((a) => { const r = ((a.ranking as { name: string; total: number }[]) || []).slice(0, 3); return (
          <div key={a.id} className="row"><div className="grow"><b>{monthName(a.id)}</b><br /><span className="note">{r.map((x, i) => `${i + 1}. ${x.name} (${x.total})`).join(" · ")}</span></div><span className="num">{String(a.members || 0)} üzv</span></div>
        ); })}</div>
      </section>
      <section className="panel box a-card"><h3>İllik cəm (arxivlənmiş aylar)</h3>
        <div className="list">{year.map(([k, v], i) => <div key={k} className="row"><span className="num" style={{ width: 24 }}>{i + 1}</span><div className="grow">{v.name}<br /><span className="note">{v.months} ay{v.wins ? ` · ${v.wins} dəfə qalib` : ""}</span></div><span className="num">{Math.round(v.sum * 10) / 10}</span></div>)}</div>
      </section>
    </div>
  );
}

function How() {
  return (
    <section className="panel box a-card"><h3>Bal necə hesablanır</h3>
      <p className="note">Hər üzv ayda 0–100 bal toplayır. Hər kanalın tam bal üçün aylıq hədəfi var: kanal balı = min(1, toplanan xal ÷ hədəf) × çəki. Bal hər ay sıfırdan başlayır, köhnə aylar arxivdə qalır.</p>
      <div className="tablewrap"><table className="table"><thead><tr><th>Kanal</th><th>Çəki</th><th>Tam bal üçün xal</th><th>Necə</th></tr></thead>
        <tbody>{CHANNELS.map((c) => <tr key={c.id}><td>{c.az}</td><td className="num">{c.weight}</td><td className="num">{c.target}</td><td>{c.how}</td></tr>)}</tbody></table></div>
      <p className="note">Ayın hər həftəsi aktiv olana ×{STREAK_MULT}. GitHub və Kaggle fəaliyyəti +{BONUS_MAX}-ə qədər bonus. Bərabər balda daha çox aktiv günü olan öndə olur. Çəki və hədəfləri lib/score.ts faylında dəyişmək olar.</p>
    </section>
  );
}
