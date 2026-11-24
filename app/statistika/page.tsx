"use client";
import { STATS, EVENTS } from "@/lib/data";
import { useLang, fmtDate } from "@/lib/i18n";
import { CountUp, PageHead } from "@/components/ui";

// Üzv artımı: qeydiyyat tarixlərindən hesablanacaq. Hələlik idarə heyətinin verdiyi rəqəmlər.
const GROWTH = [{ d: "2026-11-16", v: 0 }, { d: "2026-11-19", v: 60 }, { d: "2026-11-22", v: 110 }, { d: "2026-11-24", v: 130 }];

export default function Stats() {
  const { t, tr, lang } = useLang();
  const az = lang === "az";
  const max = Math.max(...GROWTH.map((g) => g.v));
  const byType = EVENTS.reduce<Record<string, number>>((a, e) => ((a[e.type] = (a[e.type] || 0) + 1), a), {});
  return (
    <>
      <PageHead eyebrow={t("stats")} title={az ? "Canlı statistika" : "Live stats"} lead={az ? "İcmanın böyüməsi rəqəmlərlə." : "How the community is growing."} />
      <div className="stats">
        <div className="panel stat"><div className="num"><CountUp to={STATS.members} /></div><p>{t("members")}</p></div>
        <div className="panel stat"><div className="num"><CountUp to={STATS.events} /></div><p>{t("eventsN")}</p></div>
        <div className="panel stat"><div className="num"><CountUp to={STATS.rating} decimals={1} /></div><p>{az ? "Orta rəy" : "Avg rating"}</p></div>
      </div>
      <div className="grid2">
        <div className="panel box">
          <h3>{az ? "Üzv sayı" : "Members"}</h3>
          <div className="bars-v" role="img" aria-label={GROWTH.map((g) => `${g.d}: ${g.v}`).join(", ")}>
            {GROWTH.map((g) => <div key={g.d}><b>{g.v}</b><i style={{ height: `${(g.v / max) * 75}%`, minHeight: 2 }} /><span>{fmtDate(g.d, lang, { day: "numeric", month: "short" })}</span></div>)}
          </div>
        </div>
        <div className="panel box">
          <h3>{az ? "Tədbirlər növə görə" : "Events by type"}</h3>
          <div className="list">
            {EVENTS.map((e) => <div key={e.slug} className="row"><div className="grow"><b>{tr(e.title)}</b><span>{fmtDate(e.date, lang)}</span></div><span className="pts">{e.registered}</span></div>)}
          </div>
          <p className="note" style={{ marginTop: 10 }}>{Object.entries(byType).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
        </div>
      </div>
    </>
  );
}
