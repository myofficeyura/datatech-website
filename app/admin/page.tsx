"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { BADGES, EVENTS } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { addRecord, bump, getRecord, listRecords, setRecord, toDate, type Rec } from "@/lib/store";
import { DemoBanner, PageHead, SignInGate } from "@/components/ui";
import { useToast } from "@/components/Shell";

const TABS = [
  ["qr", "QR izləmə"], ["applications", "Müraciətlər"], ["registrations", "Qeydiyyatlar"], ["points", "Xal və nişan"],
  ["certs", "Sertifikat"], ["projects", "Layihələr"], ["careers", "Karyera elanı"], ["feedback", "Rəylər"],
  ["messages", "Mesajlar"], ["bookings", "Mentor görüşləri"],
] as const;
type Tab = (typeof TABS)[number][0];

function Table({ rows, cols }: { rows: Rec[] | null; cols: string[] }) {
  if (!rows) return <p className="note">Yüklənir…</p>;
  if (!rows.length) return <p className="note">Hələ heç nə yoxdur.</p>;
  const fmt = (v: unknown) => { const d = toDate(v); if (d && typeof v !== "string") return d.toLocaleString("az"); if (typeof v === "boolean") return v ? "bəli" : "xeyr"; return v == null ? "" : String(v); };
  const csv = () => {
    const lines = [cols.join(","), ...rows.map((r) => cols.map((c) => `"${fmt(r[c]).replace(/"/g, '""')}"`).join(","))];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv" })); a.download = "datatech.csv"; a.click();
  };
  return (
    <div className="stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="note">{rows.length} sətir</span><button className="btn sec sm" type="button" onClick={csv}>CSV yüklə</button></div>
      <div className="tablewrap"><table className="table"><thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}>{cols.map((c) => <td key={c}>{fmt(r[c])}</td>)}</tr>)}</tbody></table></div>
    </div>
  );
}

function useList(col: string, deps: unknown[] = []) {
  const [rows, setRows] = useState<Rec[] | null>(null);
  const reload = () => listRecords(col, { order: "createdAt", dir: "desc", limit: 500 }).then(setRows).catch(() => listRecords(col).then(setRows).catch(() => setRows([])));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, deps);
  return { rows, reload };
}

function QrTab() {
  const toast = useToast();
  const { rows, reload } = useList("links");
  const [imgs, setImgs] = useState<Record<string, string>>({});
  const origin = typeof window !== "undefined" ? location.origin : "";
  useEffect(() => {
    rows?.forEach(async (r) => { const url = `${origin}/r/${r.id}`; const png = await QRCode.toDataURL(url, { margin: 1, width: 512 }); setImgs((m) => ({ ...m, [r.id]: png })); });
  }, [rows, origin]);
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = (String(fd.get("code") || "") || Math.random().toString(36).slice(2, 8)).toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (await getRecord("links", code)) { toast("Bu kod artıq var"); return; }
    await setRecord("links", code, { label: fd.get("label"), target: fd.get("target") || "/", channel: fd.get("channel"), hits: 0, createdAt: new Date().toISOString() });
    (e.target as HTMLFormElement).reset(); reload(); toast("QR yaradıldı");
  };
  const total = (rows || []).reduce((s, r) => s + Number(r.hits || 0), 0);
  return (
    <div className="stack">
      <p className="note">Hər elan, afişa və ya tədbir üçün ayrıca gizli QR yarat. Kod skan olunanda sayılır və istifadəçi hədəf səhifəyə keçir. Bu bölmə yalnız idarə heyətinə görünür.</p>
      <form className="panel box form" onSubmit={create}>
        <div className="grid2">
          <div className="field-row"><label htmlFor="q-label">Ad (məs. "Akt zalı afişası")</label><input className="input" id="q-label" name="label" required /></div>
          <div className="field-row"><label htmlFor="q-channel">Kanal</label><select className="input" id="q-channel" name="channel">{["Afişa", "Instagram", "TikTok", "WhatsApp", "LinkedIn", "Tədbir", "Digər"].map((x) => <option key={x}>{x}</option>)}</select></div>
        </div>
        <div className="grid2">
          <div className="field-row"><label htmlFor="q-target">Hədəf səhifə</label><select className="input" id="q-target" name="target">{["/qosul", "/", "/tedbirler", ...EVENTS.filter((e) => !e.past).map((e) => `/tedbirler/${e.slug}`), "/rey", "/quiz"].map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="field-row"><label htmlFor="q-code">Kod (boş qalsa avtomatik)</label><input className="input" id="q-code" name="code" placeholder="aktzal-dek" /></div>
        </div>
        <button className="btn pri" style={{ alignSelf: "flex-start" }}>QR yarat</button>
      </form>
      <p><b>Cəmi skan: {total}</b></p>
      {rows?.sort((a, b) => Number(b.hits || 0) - Number(a.hits || 0)).map((r) => (
        <div key={r.id} className="qr-card panel">
          {imgs[r.id] && <img src={imgs[r.id]} alt={`QR ${r.id}`} />}
          <div className="grow" style={{ flex: 1, minWidth: 180 }}>
            <b>{String(r.label)}</b>
            <p className="note">{String(r.channel)} · /r/{r.id} → {String(r.target)}</p>
            <p className="num" style={{ fontSize: 22, fontWeight: 700 }}>{Number(r.hits || 0)} <span className="note">skan</span></p>
          </div>
          {imgs[r.id] && <a className="btn sec sm" href={imgs[r.id]} download={`qr-${r.id}.png`}>PNG yüklə</a>}
        </div>
      ))}
    </div>
  );
}

function PointsTab() {
  const toast = useToast();
  const { rows, reload } = useList("members");
  const give = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const uid = String(fd.get("uid")), pts = Number(fd.get("points") || 0), note = String(fd.get("note") || ""), badge = String(fd.get("badge") || "");
    const m = rows?.find((r) => r.id === uid); if (!m) return;
    if (pts) { await bump("members", uid, "points", pts); await addRecord("activities", { uid, points: pts, note, date: new Date().toISOString().slice(0, 10) }); }
    if (badge) { const b = new Set((m.badges as string[]) || []); b.add(badge); await setRecord("members", uid, { badges: [...b] }); }
    toast("Yadda saxlandı"); reload(); (e.target as HTMLFormElement).reset();
  };
  return (
    <div className="stack">
      <form className="panel box form" onSubmit={give}>
        <div className="grid2">
          <div className="field-row"><label htmlFor="pt-uid">Üzv</label><select className="input" id="pt-uid" name="uid" required>{rows?.map((r) => <option key={r.id} value={r.id}>{String(r.name)} ({Number(r.points || 0)})</option>)}</select></div>
          <div className="field-row"><label htmlFor="pt-pts">Xal (+/-)</label><input className="input" id="pt-pts" name="points" type="number" defaultValue={200} /></div>
        </div>
        <div className="grid2">
          <div className="field-row"><label htmlFor="pt-note">Səbəb</label><input className="input" id="pt-note" name="note" placeholder="AI və İnsan tədbirində iştirak" required /></div>
          <div className="field-row"><label htmlFor="pt-badge">Nişan (istəyə bağlı)</label><select className="input" id="pt-badge" name="badge" defaultValue=""><option value="">—</option>{BADGES.map((b) => <option key={b.id} value={b.id}>{b.name.az}</option>)}</select></div>
        </div>
        <button className="btn pri" style={{ alignSelf: "flex-start" }}>Əlavə et</button>
      </form>
      <Table rows={rows ? [...rows].sort((a, b) => Number(b.points || 0) - Number(a.points || 0)) : null} cols={["name", "faculty", "points", "refCode"]} />
    </div>
  );
}

function CertTab() {
  const toast = useToast();
  const { rows, reload } = useList("certificates");
  const members = useList("members").rows;
  const issue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const uid = String(fd.get("uid")); const m = members?.find((x) => x.id === uid);
    const code = `DT-${new Date().getFullYear()}-${String((rows?.length || 0) + 1).padStart(4, "0")}`;
    await setRecord("certificates", code, { uid, name: m?.name, title: fd.get("title"), date: fd.get("date"), createdAt: new Date().toISOString() });
    toast(`Sertifikat ${code} verildi`); reload();
  };
  return (
    <div className="stack">
      <form className="panel box form" onSubmit={issue}>
        <div className="grid3">
          <div className="field-row"><label htmlFor="c-uid">Üzv</label><select className="input" id="c-uid" name="uid" required>{members?.map((r) => <option key={r.id} value={r.id}>{String(r.name)}</option>)}</select></div>
          <div className="field-row"><label htmlFor="c-title">Ad</label><input className="input" id="c-title" name="title" placeholder="Python ilə data analizi: Giriş" required /></div>
          <div className="field-row"><label htmlFor="c-date">Tarix</label><input className="input" id="c-date" name="date" type="date" required /></div>
        </div>
        <button className="btn pri" style={{ alignSelf: "flex-start" }}>Sertifikat ver</button>
      </form>
      <Table rows={rows} cols={["id", "name", "title", "date"]} />
    </div>
  );
}

function ProjectsTab() {
  const { rows, reload } = useList("projects");
  return (
    <div className="stack">
      {rows?.map((p) => (
        <div key={p.id} className="panel box" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}><b>{String(p.title)}</b><p className="note">{String(p.owner || "")} · {String(p.summary || "").slice(0, 140)}</p></div>
          <button className={"btn sm " + (p.approved ? "sec" : "pri")} type="button" onClick={async () => { await setRecord("projects", p.id, { approved: !p.approved }); reload(); }}>{p.approved ? "Gizlət" : "Təsdiqlə"}</button>
        </div>
      ))}
      {rows?.length === 0 && <p className="note">Hələ layihə göndərilməyib.</p>}
    </div>
  );
}

function CareersTab() {
  const toast = useToast();
  const { rows, reload } = useList("careers");
  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget); const d: Record<string, unknown> = {}; fd.forEach((v, k) => (d[k] = v));
    await addRecord("careers", d); toast("Elan əlavə olundu"); reload(); (e.target as HTMLFormElement).reset();
  };
  return (
    <div className="stack">
      <form className="panel box form" onSubmit={add}>
        <div className="grid2">
          <div className="field-row"><label htmlFor="k-title">Vəzifə</label><input className="input" id="k-title" name="title" required /></div>
          <div className="field-row"><label htmlFor="k-company">Şirkət</label><input className="input" id="k-company" name="company" required /></div>
        </div>
        <div className="grid3">
          <div className="field-row"><label htmlFor="k-kind">Növ</label><select className="input" id="k-kind" name="kind">{["Təcrübə", "İş", "Təqaüd", "Proqram"].map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="field-row"><label htmlFor="k-deadline">Son tarix</label><input className="input" id="k-deadline" name="deadline" type="date" /></div>
          <div className="field-row"><label htmlFor="k-url">Link</label><input className="input" id="k-url" name="url" type="url" required /></div>
        </div>
        <button className="btn pri" style={{ alignSelf: "flex-start" }}>Elan əlavə et</button>
      </form>
      <Table rows={rows} cols={["title", "company", "kind", "deadline", "url"]} />
    </div>
  );
}

function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("qr");
  const lists: Partial<Record<Tab, [string, string[]]>> = {
    applications: ["applications", ["createdAt", "name", "email", "phone", "faculty", "year", "level", "goals", "referredBy"]],
    registrations: ["registrations", ["event", "name", "active", "updatedAt"]],
    feedback: ["feedback", ["createdAt", "stars", "about", "text", "name"]],
    messages: ["messages", ["createdAt", "name", "email", "topic", "message"]],
    bookings: ["bookings", ["createdAt", "name", "email", "mentor", "slot", "topic"]],
  };
  if (!user?.isAdmin) return <div className="panel empty"><b>Bu bölmə yalnız idarə heyəti üçündür.</b></div>;
  const L = lists[tab];
  return (
    <>
      <div className="adm-tabs">{TABS.map(([k, v]) => <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{v}</button>)}</div>
      {tab === "qr" && <QrTab />}
      {tab === "points" && <PointsTab />}
      {tab === "certs" && <CertTab />}
      {tab === "projects" && <ProjectsTab />}
      {tab === "careers" && <CareersTab />}
      {L && <ListTab key={tab} col={L[0]} cols={L[1]} />}
    </>
  );
}
function ListTab({ col, cols }: { col: string; cols: string[] }) { const { rows } = useList(col, [col]); return <Table rows={rows} cols={cols} />; }

export default function Page() {
  const { lang } = useLang();
  return (
    <>
      <PageHead eyebrow="Admin" title={lang === "az" ? "İdarə paneli" : "Admin panel"} />
      <DemoBanner />
      <SignInGate><Admin /></SignInGate>
    </>
  );
}
