"use client";
import { useState } from "react";
import { ROADMAP_90, ROADMAP_YEAR, type RoadItem } from "@/lib/data";
import { fmtDate, useLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";

const TAG = { event: ["Tədbir", "Event", ""], learn: ["Təhsil", "Learning", " g"], growth: ["İnkişaf", "Growth", ""], milestone: ["Mərhələ", "Milestone", " a"] } as const;

function Timeline({ items }: { items: RoadItem[] }) {
  const { tr, lang } = useLang();
  const today = new Date().toISOString().slice(0, 10);
  const nextIdx = items.findIndex((i) => i.date >= today);
  return (
    <div className="timeline">
      {items.map((it, i) => {
        const tg = TAG[it.tag];
        return (
          <div key={it.date + i} className={"panel tl" + (it.date < today ? " done" : "") + (i === nextIdx ? " next" : "")}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <span className="when">{fmtDate(it.date, lang)}</span>
              <span className={"tag" + tg[2]}>{lang === "az" ? tg[0] : tg[1]}</span>
            </div>
            <h3>{tr(it.title)}</h3>
            <p>{tr(it.desc)}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function Roadmap() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<"90" | "year">("90");
  const az = lang === "az";
  return (
    <>
      <PageHead eyebrow={t("roadmap")} title={az ? "Hara gedirik" : "Where we're going"}
        lead={az ? "Tarixli plan: ilk 90 gün (25 noyabr 2026 – 22 fevral 2027) və 1 illik hədəflər (noyabr 2027-yə qədər)." : "Dated plan: the first 90 days (25 Nov 2026 – 22 Feb 2027) and one-year goals (to Nov 2027)."}>
        <div className="tabs" role="tablist" style={{ alignSelf: "flex-start", marginTop: 8 }}>
          <button type="button" className={tab === "90" ? "on" : ""} onClick={() => setTab("90")}>{az ? "90 gün" : "90 days"}</button>
          <button type="button" className={tab === "year" ? "on" : ""} onClick={() => setTab("year")}>{az ? "1 il" : "1 year"}</button>
        </div>
      </PageHead>
      <Timeline items={tab === "90" ? ROADMAP_90 : ROADMAP_YEAR} />
    </>
  );
}
