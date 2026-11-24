"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BADGES, EVENTS } from "@/lib/data";
import { fmtDate, useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { firebaseEnabled } from "@/lib/firebase";
import { listRecords, type Rec } from "@/lib/store";
import { CountUp, LbRows, SignInGate, useLeaderboard } from "@/components/ui";
import { BadgeGrid } from "@/components/BadgeGrid";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Shell";

const DEMO_CERTS: Rec[] = [];
const DEMO_ACT: Rec[] = [];

function Cabinet() {
  const { user, signOut } = useAuth();
  const { lang, t } = useLang();
  const toast = useToast();
  const lb = useLeaderboard(100);
  const [certs, setCerts] = useState<Rec[]>([]);
  const [acts, setActs] = useState<Rec[]>([]);
  const [regs, setRegs] = useState<Rec[]>([]);
  const az = lang === "az";
  useEffect(() => {
    if (!user) return;
    if (!firebaseEnabled) { setCerts(DEMO_CERTS); setActs(DEMO_ACT); }
    else {
      listRecords("certificates", { whereEq: ["uid", user.uid] }).then(setCerts).catch(() => {});
      listRecords("activities", { whereEq: ["uid", user.uid] }).then(setActs).catch(() => {});
    }
    listRecords("registrations", { whereEq: ["uid", user.uid] }).then((r) => setRegs(r.filter((x) => x.active))).catch(() => {});
  }, [user]);
  if (!user) return null;
  const rank = lb ? lb.findIndex((r) => r.id === user.uid) + 1 : 0;
  const nextBadgeAt = 1500;
  const pct = Math.min(100, Math.round((user.points / nextBadgeAt) * 100));
  const invite = typeof window !== "undefined" ? `${location.origin}/d/${user.refCode}` : "";
  const copy = async (v: string) => { try { await navigator.clipboard.writeText(v); toast(az ? "Kopyalandı" : "Copied"); } catch { toast(v); } };
  const myIdx = lb ? lb.findIndex((r) => r.id === user.uid) : -1;
  const pick = lb ? Array.from(new Set([0, 1, 2, Math.max(0, myIdx - 1), myIdx, myIdx + 1].filter((i) => i >= 0 && i < lb.length))).sort((a, b) => a - b) : [];

  return (
    <>
      <div className="cab-head rise">
        <div className="big-av">{user.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 200 }}><h1>{az ? "Salam" : "Hi"}, {user.name.split(" ")[0]}</h1><p className="muted">{[user.faculty, user.year && `${user.year}-${az ? "ci kurs" : " year"}`].filter(Boolean).join(" · ") || user.email}</p></div>
        <div style={{ display: "flex", gap: 8 }}><Link className="btn sec sm" href="/tedbirler">{az ? "Tədbirə yazıl" : "Join an event"}</Link><button className="btn sec sm" type="button" onClick={signOut}>{t("signout")}</button></div>
      </div>

      <div className="stack" style={{ gap: 12 }}>
        <div className="kpis">
          <div className="panel kpi">
            <span className="lbl">{t("points")}</span>
            <div className="num"><CountUp to={user.points} /></div>
            <div className="prog"><i style={{ width: `${pct}%` }} /></div>
            <span className="lbl">{user.points < nextBadgeAt ? <>"Data Explorer" {az ? "nişanına" : "badge in"} <b style={{ color: "var(--fg)" }}>{nextBadgeAt - user.points} {az ? "xal" : "pts"}</b> {az ? "qalıb" : ""}</> : (az ? "Data Explorer nişanı açıldı" : "Data Explorer unlocked")}</span>
          </div>
          <div className="panel kpi"><span className="lbl">{az ? "Reytinq yeri" : "Rank"}</span><div className="num">{rank ? <>#<CountUp to={rank} /></> : "–"}</div><span className="lbl">{lb?.length || 0} {az ? "üzv arasında" : "members"}</span></div>
          <div className="panel kpi"><span className="lbl">{t("events")}</span><div className="num"><CountUp to={regs.length} /></div><span className="lbl">{az ? "qeydiyyat" : "registrations"}</span></div>
        </div>

        <div className="cols">
          <div className="stack" style={{ minWidth: 0 }}>
            <div className="panel box">
              <h3>{az ? "Nişanlar" : "Badges"} <span className="muted num" style={{ fontSize: 13 }}>{user.badges.length} / {BADGES.length}</span></h3>
              <BadgeGrid have={user.badges} />
            </div>
            <div className="panel box">
              <h3>{az ? "Sertifikatlar" : "Certificates"}</h3>
              {certs.length === 0 && <p className="note">{az ? "Hələ sertifikat yoxdur. Workshop və kursları bitirəndə burada görünəcək." : "No certificates yet. They appear here after workshops and courses."}</p>}
              {certs.map((c) => (
                <div className="cert" key={c.id}>
                  <div className="doc" />
                  <div className="grow"><b>{String(c.title)}</b><span className="muted" style={{ fontSize: 13 }}>{fmtDate(String(c.date), lang)} · </span><code>{c.id}</code></div>
                  <div className="acts">
                    <Link className="btn sec sm" href={`/sertifikat/${c.id}?print=1`}><Icon name="dl" size={16} />{az ? "Yüklə" : "Download"}</Link>
                    <button className="btn sec sm" type="button" onClick={() => copy(`${location.origin}/sertifikat/${c.id}`)}><Icon name="shield" size={16} />{az ? "Yoxlama linki" : "Verify link"}</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="panel box stack">
              <h3>{az ? "Dəvət linkin" : "Your invite link"}</h3>
              <p className="note">{az ? "Dostun bu linklə qoşulsa, hər biri üçün +50 xal. Həftənin ən çox üzv gətirəni \"Həftənin ambassadoru\" olur." : "+50 points for every friend who joins with this link. The top recruiter each week becomes Ambassador of the week."}</p>
              <div style={{ display: "flex", gap: 8 }}><input className="input" readOnly value={invite} id="invite" aria-label="Dəvət linki" onFocus={(e) => e.target.select()} /><button className="btn pri sm" style={{ height: 46 }} type="button" onClick={() => copy(invite)}><Icon name="copy" size={16} /></button></div>
            </div>
          </div>
          <div className="stack" style={{ minWidth: 0 }}>
            <div className="panel box">
              <h3>{t("rating")} <Link href="/reytinq" style={{ fontSize: 13, color: "var(--blue-hi)", textDecoration: "none" }}>{t("seeAll")}</Link></h3>
              {lb ? <LbRows rows={lb} meId={user.uid} pick={pick} /> : <p className="note">{t("loading")}</p>}
            </div>
            <div className="panel box">
              <h3>{az ? "Qeydiyyatlarım" : "My registrations"}</h3>
              <div className="list">
                {regs.length === 0 && <p className="note">{az ? "Hələ heç bir tədbirə yazılmamısan." : "No registrations yet."}</p>}
                {regs.map((r) => { const e = EVENTS.find((x) => x.slug === r.event); return e && (
                  <Link key={r.id} href={`/tedbirler/${e.slug}`} className="row" style={{ textDecoration: "none" }}><Icon name="cal" size={20} style={{ color: "var(--blue-hi)" }} /><div className="grow"><b>{e.title[lang]}</b><span>{fmtDate(e.date, lang)}, {e.time}</span></div></Link>
                ); })}
              </div>
            </div>
            <div className="panel box">
              <h3>{az ? "Xal tarixçəsi" : "Points history"}</h3>
              <div className="list">
                {acts.length === 0 && <p className="note">{az ? "Tədbirlərdə iştirak etdikcə xallar burada görünəcək." : "Points appear here as you take part."}</p>}
                {acts.map((a) => <div key={a.id} className="row"><Icon name="check" size={20} style={{ color: "var(--green)" }} /><div className="grow"><b>{String(a.note)}</b><span>{a.date ? fmtDate(String(a.date), lang) : ""}</span></div><span className="pts">+{String(a.points)}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return <SignInGate><Cabinet /></SignInGate>;
}
