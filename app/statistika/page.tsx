"use client";
import { STATS, EVENTS } from "@/lib/data";
import { useLang, fmtDate } from "@/lib/i18n";
import { CountUp, Empty, PageHead } from "@/components/ui";

export default function Stats() {
  const { t, tr, lang } = useLang();
  const az = lang === "az";
  const items = ([[t("members"), STATS.members, 0], [t("eventsN"), STATS.events, 0], [az ? "Orta rəy" : "Avg rating", STATS.rating, 1]] as const).filter(([, v]) => v > 0);
  const byType = EVENTS.reduce<Record<string, number>>((a, e) => ((a[e.type] = (a[e.type] || 0) + 1), a), {});
  return (
    <>
      <PageHead eyebrow={t("stats")} title={az ? "Canlı statistika" : "Live stats"} lead={az ? "İcmanın böyüməsi rəqəmlərlə." : "How the community is growing."} />
      {items.length === 0 && <Empty />}
      {items.length > 0 && <div className="stats">
        {items.map(([k, v, d]) => <div key={k} className="panel stat"><div className="num"><CountUp to={v} decimals={d} /></div><p>{k}</p></div>)}
      </div>}
      <div className="grid2" style={{ gridTemplateColumns: "1fr" }}>
        <div className="panel box">
          <h3>{az ? "Tədbirlər növə görə" : "Events by type"}</h3>
          <div className="list">
            {EVENTS.map((e) => <div key={e.slug} className="row"><div className="grow"><b>{tr(e.title)}</b><span>{fmtDate(e.date, lang)}</span></div>{e.registered > 0 && <span className="pts">{e.registered}</span>}</div>)}
          </div>
          <p className="note" style={{ marginTop: 10 }}>{Object.entries(byType).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
        </div>
      </div>
    </>
  );
}
