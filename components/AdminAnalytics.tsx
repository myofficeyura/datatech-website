"use client";
// Admin analitika: saytda baş verən hər şey. Məlumat `events` kolleksiyasından (lib/track.ts) gəlir.
import { Fragment, useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query, Timestamp, where } from "firebase/firestore";
import { fb } from "@/lib/firebase";
import { listRecords, toDate, type Rec } from "@/lib/store";
import { bakuParts } from "@/lib/track";

type Ev = Rec & { type: string; path?: string; label?: string; target?: string; text?: string; code?: string; value?: number;
  vid: string; sid: string; uid?: string | null; src?: string; dev?: string; os?: string; br?: string; day: string; hour: number; at: Date | null };

const PERIODS = [["1", "Bu gün"], ["7", "7 gün"], ["30", "30 gün"], ["90", "90 gün"]] as const;
const TYPE_AZ: Record<string, string> = {
  page_view: "Səhifə baxışı", sign_in: "Giriş", sign_up: "Yeni üzv", form_submit: "Form göndərdi", event_register: "Tədbirə yazıldı",
  event_unregister: "Qeydiyyatı ləğv etdi", rating: "Qiymət verdi", chat_question: "Çatbota sual", qr_scan: "QR skan", click_out: "Xarici link",
};
const FORM_AZ: Record<string, string> = { applications: "Qoşulma müraciəti", messages: "Əlaqə mesajı", feedback: "Rəy", bookings: "Mentor görüşü", projects: "Layihə", teamPosts: "Komanda axtar" };

const fmtN = (n: number) => n.toLocaleString("az");
const fmtT = (d: Date | null) => (d ? d.toLocaleString("az", { timeZone: "Asia/Baku", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");
const uniq = (a: Ev[], k: keyof Ev) => new Set(a.map((e) => e[k])).size;
function countBy(a: Ev[], f: (e: Ev) => string | undefined | null, uniqueBy?: keyof Ev) {
  const m = new Map<string, Set<unknown> | number>();
  for (const e of a) {
    const k = f(e); if (!k) continue;
    if (uniqueBy) { const s = (m.get(k) as Set<unknown>) || new Set(); s.add(e[uniqueBy]); m.set(k, s); }
    else m.set(k, ((m.get(k) as number) || 0) + 1);
  }
  return [...m.entries()].map(([k, v]) => [k, typeof v === "number" ? v : v.size] as [string, number]).sort((x, y) => y[1] - x[1]);
}
function daysBack(n: number) { const out: string[] = []; for (let i = n - 1; i >= 0; i--) out.push(bakuParts(new Date(Date.now() - i * 864e5)).day); return out; }
function csv(name: string, cols: string[], rows: (string | number)[][]) {
  const lines = [cols.join(","), ...rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))];
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv" })); a.download = name; a.click();
}

async function loadEvents(sinceDays: number): Promise<Ev[]> {
  const f = fb(); if (!f) return [];
  const since = Timestamp.fromMillis(Date.now() - sinceDays * 864e5);
  const s = await getDocs(query(collection(f.db, "events"), where("createdAt", ">=", since), orderBy("createdAt", "desc"), limit(8000)));
  return s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: toDate(x.createdAt) } as Ev; });
}

/* ---------- kiçik vizual komponentlər ---------- */
function Kpi({ label, now, prev, hint }: { label: string; now: number; prev?: number; hint?: string }) {
  const d = prev == null ? null : prev === 0 ? (now > 0 ? 100 : 0) : Math.round(((now - prev) / prev) * 100);
  return (
    <div className="panel kpi a-kpi" title={hint}>
      <span className="lbl">{label}</span>
      <div className="num">{fmtN(now)}</div>
      {d != null && <span className={"delta " + (d > 0 ? "up" : d < 0 ? "down" : "")}>{d > 0 ? "▲" : d < 0 ? "▼" : "•"} {Math.abs(d)}% <span className="muted">əvvəlki dövrə görə</span></span>}
    </div>
  );
}
function Columns({ data, unit }: { data: [string, number][]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return (
    <>
    <div className="a-cols" role="img" aria-label={data.map(([k, v]) => `${k}: ${v}`).join(", ")}>
      {data.map(([k, v]) => (
        <div key={k} className="a-col" tabIndex={0}>
          <i style={{ height: `${(v / max) * 100}%` }} />
          <span className="tip"><b>{fmtN(v)}</b> {unit}<br />{k}</span>
        </div>
      ))}
    </div>
    {data.length <= 31 && <div className="a-xl">{data.map(([k], i) => <span key={k}>{data.length <= 12 || i % Math.ceil(data.length / 8) === 0 ? k : ""}</span>)}</div>}
    </>
  );
}
function HBars({ data, total, empty = "Hələ məlumat yoxdur", max = 10, fmt }: { data: [string, number][]; total?: number; empty?: string; max?: number; fmt?: (k: string) => string }) {
  if (!data.length) return <p className="note">{empty}</p>;
  const top = Math.max(1, data[0][1]); const sum = total ?? data.reduce((s, d) => s + d[1], 0);
  return (
    <div className="a-hbars">
      {data.slice(0, max).map(([k, v]) => (
        <div key={k} className="a-hbar" title={`${fmt ? fmt(k) : k}: ${v} (${Math.round((v / Math.max(1, sum)) * 100)}%)`}>
          <span className="k">{fmt ? fmt(k) : k}</span>
          <span className="bar"><i style={{ width: `${(v / top) * 100}%` }} /></span>
          <span className="v num">{fmtN(v)}</span>
        </div>
      ))}
    </div>
  );
}
function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="panel box a-card"><h3>{title}{action}</h3>{children}</section>;
}

/* ---------- əsas panel ---------- */
export function AnalyticsTab() {
  const [period, setPeriod] = useState(7);
  const [all, setAll] = useState<Ev[] | null>(null);
  const [members, setMembers] = useState<Rec[]>([]);
  const [live, setLive] = useState(false);
  const [err, setErr] = useState("");
  const [stamp, setStamp] = useState(0);

  useEffect(() => {
    let off = false;
    setErr("");
    loadEvents(period * 2).then((r) => { if (!off) setAll(r); }).catch((e) => { if (!off) { setAll([]); setErr(String(e.message || e)); } });
    return () => { off = true; };
  }, [period, stamp]);
  useEffect(() => { listRecords("members").then(setMembers).catch(() => {}); }, [stamp]);
  useEffect(() => { if (!live) return; const t = setInterval(() => setStamp((s) => s + 1), 20000); return () => clearInterval(t); }, [live]);

  const names = useMemo(() => new Map(members.map((m) => [m.id, String(m.name || "")])), [members]);
  const cut = Date.now() - period * 864e5;
  const cur = useMemo(() => (all || []).filter((e) => (e.at?.getTime() ?? 0) >= cut), [all, cut]);
  const prev = useMemo(() => (all || []).filter((e) => (e.at?.getTime() ?? 0) < cut), [all, cut]);

  if (!fb()) return <p className="note">Analitika yalnız Firebase qoşulu olanda işləyir (canlı saytda).</p>;
  if (!all) return <p className="note">Yüklənir…</p>;

  const of = (a: Ev[], t: string) => a.filter((e) => e.type === t);
  const pv = of(cur, "page_view"), pvP = of(prev, "page_view");
  const wa = (a: Ev[]) => of(a, "click_out").filter((e) => (e.target || "").includes("whatsapp")).length;
  const sessions = uniq(pv, "sid");
  const days = daysBack(Math.max(period, 7));
  const byDayV = countBy(pv, (e) => e.day, "vid"); const dv = new Map(byDayV);
  const hours = Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, "0")}:00`, pv.filter((e) => e.hour === h).length] as [string, number]);
  const join = new Set(pv.filter((e) => e.path === "/qosul").map((e) => e.vid));
  const signed = new Set(of(cur, "sign_in").concat(of(cur, "sign_up")).map((e) => e.vid));
  const applied = new Set(of(cur, "form_submit").filter((e) => e.label === "applications").map((e) => e.vid));
  const waV = new Set(of(cur, "click_out").filter((e) => (e.target || "").includes("whatsapp")).map((e) => e.vid));
  const funnel: [string, number][] = [["Ziyarətçi", uniq(pv, "vid")], ["Qoşul səhifəsinə baxan", join.size], ["Google ilə daxil olan", signed.size], ["Müraciət göndərən", applied.size], ["WhatsApp-a keçən", waV.size]];
  const srcName = (s: string) => (s.startsWith("qr:") ? `QR · ${s.slice(3)}` : s);
  const feed = cur.slice(0, 150);

  return (
    <div className="stack a-wrap">
      <div className="a-bar">
        <div className="tabs">{PERIODS.map(([v, l]) => <button key={v} type="button" className={period === Number(v) ? "on" : ""} onClick={() => { setAll(null); setPeriod(Number(v)); }}>{l}</button>)}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label className="note" style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Canlı (20 san)</label>
          <button className="btn sec sm" type="button" onClick={() => setStamp((s) => s + 1)}>Yenilə</button>
          <button className="btn sec sm" type="button" onClick={() => csv(`datatech-hadiseler-${period}g.csv`, ["vaxt", "növ", "səhifə", "etiket", "hədəf", "mətn", "ziyarətçi", "sessiya", "üzv", "mənbə", "cihaz", "OS", "brauzer"],
            cur.map((e) => [fmtT(e.at), TYPE_AZ[e.type] || e.type, e.path || "", e.label || e.code || "", e.target || "", e.text || "", e.vid, e.sid, e.uid ? names.get(e.uid) || e.uid : "", srcName(e.src || ""), e.dev || "", e.os || "", e.br || ""]))}>Bütün hadisələr CSV</button>
        </div>
      </div>
      {err && <p className="err">Oxunmadı: {err}. Firestore qaydalarını yenilədiyinə əmin ol.</p>}

      <div className="a-kpis">
        <Kpi label="Unikal ziyarətçi" now={uniq(pv, "vid")} prev={uniq(pvP, "vid")} hint="Fərqli brauzerlərin sayı" />
        <Kpi label="Sessiya" now={sessions} prev={uniq(pvP, "sid")} />
        <Kpi label="Səhifə baxışı" now={pv.length} prev={pvP.length} />
        <Kpi label="Yeni üzv" now={of(cur, "sign_up").length} prev={of(prev, "sign_up").length} />
        <Kpi label="WhatsApp-a keçid" now={wa(cur)} prev={wa(prev)} />
        <Kpi label="QR skan" now={of(cur, "qr_scan").length} prev={of(prev, "qr_scan").length} />
        <Kpi label="Çatbot sualı" now={of(cur, "chat_question").length} prev={of(prev, "chat_question").length} />
        <Kpi label="Form göndərişi" now={of(cur, "form_submit").length} prev={of(prev, "form_submit").length} />
      </div>
      <p className="note">Baxış / sessiya: <b>{sessions ? (pv.length / sessions).toFixed(1) : "0"}</b> · Mobil payı: <b>{pv.length ? Math.round((pv.filter((e) => e.dev === "mobile").length / pv.length) * 100) : 0}%</b> · Cəmi üzv (bazada): <b>{members.length}</b></p>

      <Card title="Günlük unikal ziyarətçi"><Columns data={days.map((d) => [d.slice(5).split("-").reverse().join("."), dv.get(d) || 0])} unit="ziyarətçi" /></Card>

      <div className="grid2">
        <Card title="Qoşulma hunisi (unikal ziyarətçi)"><HBars data={funnel} total={funnel[0][1]} /></Card>
        <Card title="Saata görə baxışlar (Bakı vaxtı)"><Columns data={hours} unit="baxış" /></Card>
      </div>

      <div className="grid2">
        <Card title="Ən çox baxılan səhifələr"><HBars data={countBy(pv, (e) => e.path)} max={12} /></Card>
        <Card title="Haradan gəlirlər"><HBars data={countBy(pv, (e) => e.src, "vid")} fmt={srcName} /></Card>
      </div>

      <div className="grid3">
        <Card title="Cihaz"><HBars data={countBy(pv, (e) => e.dev, "vid")} fmt={(k) => ({ mobile: "Telefon", desktop: "Kompüter", tablet: "Planşet" }[k] || k)} /></Card>
        <Card title="Əməliyyat sistemi"><HBars data={countBy(pv, (e) => e.os, "vid")} /></Card>
        <Card title="Brauzer / tətbiq"><HBars data={countBy(pv, (e) => e.br, "vid")} /></Card>
      </div>

      <div className="grid2">
        <Card title="Xarici link klikləri"><HBars data={countBy(of(cur, "click_out"), (e) => e.target)} /></Card>
        <Card title="QR kodlar (skan)"><HBars data={countBy(of(cur, "qr_scan"), (e) => e.code)} empty="Bu dövrdə QR skan olmayıb" /></Card>
      </div>

      <div className="grid2">
        <Card title="Formlar və qeydiyyatlar"><HBars data={countBy(cur.filter((e) => ["form_submit", "event_register", "rating"].includes(e.type)), (e) => e.type === "form_submit" ? FORM_AZ[e.label || ""] || e.label : `${TYPE_AZ[e.type]} · ${e.label}`)} /></Card>
        <Card title="Çatbota verilən suallar">
          {of(cur, "chat_question").length ? <div className="list a-scroll">{of(cur, "chat_question").slice(0, 60).map((e) => (
            <div key={e.id} className="row"><div className="grow"><b style={{ fontWeight: 500 }}>{e.text}</b><span>{fmtT(e.at)} · {e.uid ? names.get(e.uid) || "üzv" : "qonaq"}</span></div></div>
          ))}</div> : <p className="note">Bu dövrdə sual yoxdur</p>}
        </Card>
      </div>

      <Card title={`Canlı lent (son ${feed.length} hadisə)`}>
        {feed.length ? <div className="tablewrap a-scroll"><table className="table"><thead><tr><th>Vaxt</th><th>Hadisə</th><th>Detal</th><th>Kim</th><th>Mənbə</th><th>Cihaz</th></tr></thead>
          <tbody>{feed.map((e) => (
            <tr key={e.id}>
              <td className="num" style={{ whiteSpace: "nowrap" }}>{fmtT(e.at)}</td>
              <td><span className={"tag" + (e.type === "page_view" ? "" : e.type === "sign_up" || e.type === "form_submit" ? " g" : " a")}>{TYPE_AZ[e.type] || e.type}</span></td>
              <td>{e.type === "chat_question" ? `“${e.text}”` : e.type === "click_out" ? e.target : e.type === "form_submit" ? FORM_AZ[e.label || ""] || e.label : [e.path, e.label || e.code].filter(Boolean).join(" · ")}</td>
              <td>{e.uid ? names.get(e.uid) || "üzv" : <span className="muted">qonaq #{e.vid.slice(0, 5)}</span>}</td>
              <td>{srcName(e.src || "")}</td>
              <td className="muted">{e.dev === "mobile" ? "Telefon" : e.dev === "tablet" ? "Planşet" : "Kompüter"} · {e.br}</td>
            </tr>
          ))}</tbody></table></div> : <p className="note">Bu dövrdə hadisə yoxdur. Analitika yeni qurulub, məlumat bu andan toplanır.</p>}
      </Card>
    </div>
  );
}

/* ---------- üzvlər: bütün məlumat bir yerdə ---------- */
export function MembersTab() {
  const [rows, setRows] = useState<Rec[] | null>(null);
  const [ev, setEv] = useState<Ev[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([listRecords("members"), listRecords("users").catch(() => []), listRecords("applications").catch(() => [])]).then(([m, u, a]) => {
      const um = new Map(u.map((x) => [x.id, x])); const am = new Map(a.filter((x) => x.uid).map((x) => [String(x.uid), x]));
      setRows(m.map((x) => ({ ...x, ...(um.get(x.id) || {}), app: am.get(x.id) || null, id: x.id })));
    }).catch(() => setRows([]));
    loadEvents(90).then(setEv).catch(() => {});
  }, []);
  const stats = useMemo(() => {
    const s = new Map<string, { n: number; last: Date | null; pv: number }>();
    for (const e of ev) { if (!e.uid) continue; const o = s.get(e.uid) || { n: 0, last: null, pv: 0 }; o.n++; if (e.type === "page_view") o.pv++; if (!o.last || (e.at && e.at > o.last)) o.last = e.at; s.set(e.uid, o); }
    return s;
  }, [ev]);
  if (!rows) return <p className="note">Yüklənir…</p>;
  const list = rows.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
  const cols = ["Ad", "E-poçt", "Fakültə", "Kurs", "Xal", "Nişan", "Qoşulub", "Son aktivlik", "Hadisə (90g)", "Dəvət edən"];
  const line = (r: Rec) => { const st = stats.get(r.id); const app = r.app as Rec | null;
    return [String(r.name || ""), String(r.email || ""), String(r.faculty || app?.faculty || ""), String(r.year || app?.year || ""), Number(r.points || 0), ((r.badges as string[]) || []).length,
      fmtT(toDate(r.joinedAt) || toDate(r.updatedAt)), fmtT(st?.last || null), st?.n || 0, String(r.referredBy || "")]; };
  return (
    <div className="stack">
      <div className="a-bar">
        <input className="input" placeholder="Axtar: ad, e-poçt, fakültə…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 360 }} />
        <button className="btn sec sm" type="button" onClick={() => csv("datatech-uzvler.csv", cols, list.map(line))}>CSV yüklə ({list.length})</button>
      </div>
      <div className="tablewrap"><table className="table"><thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{list.map((r) => { const l = line(r); return (
          <Fragment key={r.id}>
            <tr onClick={() => setOpen(open === r.id ? null : r.id)} style={{ cursor: "pointer" }}>{l.map((v, i) => <td key={i} className={typeof v === "number" ? "num" : ""}>{String(v)}</td>)}</tr>
            {open === r.id && <tr><td colSpan={cols.length}>
              <div className="list a-scroll">{ev.filter((e) => e.uid === r.id).slice(0, 80).map((e) => (
                <div key={e.id} className="row"><span className="num muted" style={{ width: 110 }}>{fmtT(e.at)}</span><div className="grow"><b style={{ fontWeight: 500 }}>{TYPE_AZ[e.type] || e.type}</b> <span>{e.text || e.target || e.label || e.path}</span></div></div>
              ))}{!ev.some((e) => e.uid === r.id) && <p className="note">Son 90 gündə qeyd olunmuş hadisə yoxdur.</p>}</div>
            </td></tr>}
          </Fragment>
        ); })}</tbody></table></div>
      <p className="note">Sətirə klikləsən, həmin üzvün son 90 gündəki bütün hərəkətləri açılır.</p>
    </div>
  );
}
