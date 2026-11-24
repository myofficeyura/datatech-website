"use client";
import Link from "next/link";
import { COMPETITIONS } from "@/lib/data";
import { fmtDate, useLang } from "@/lib/i18n";
import { Empty, PageHead } from "@/components/ui";

export default function Competitions() {
  const { tr, t, lang } = useLang();
  const az = lang === "az";
  return (
    <>
      <PageHead eyebrow={t("competitions")} title={az ? "Yarışlar və hackathonlar" : "Competitions & hackathons"} lead={az ? "Daxili yarışlar, tərəfdaşlarla hackathonlar və online yarışlar. Komandan yoxdursa, Komanda axtar bölməsindən tap." : "Internal contests, partner hackathons and online competitions. No team? Find one in the Team finder."} />
      {COMPETITIONS.length === 0 && <Empty />}
      <div className="grid3">
        {COMPETITIONS.map((c) => {
          const ext = c.url.startsWith("http");
          return (
            <article key={c.title.az} className="panel ev">
              <span className={"tag" + (c.status === "open" ? " g" : " a")} style={{ alignSelf: "flex-start" }}>{c.status === "open" ? (az ? "Açıq" : "Open") : (az ? "Tezliklə" : "Soon")}</span>
              <h3>{tr(c.title)}</h3>
              <div className="meta"><span>{tr(c.kind)}</span>{c.date && <span>{fmtDate(c.date, lang)}</span>}</div>
              <div className="foot">{ext ? <a className="btn sec sm" href={c.url} target="_blank" rel="noreferrer">{az ? "Keç" : "Open"} →</a> : <Link className="btn sec sm" href={c.url}>{az ? "Ətraflı" : "Details"}</Link>}</div>
            </article>
          );
        })}
      </div>
      <Link className="btn pri" href="/komanda-axtar" style={{ alignSelf: "flex-start" }}>{t("teamfinder")}</Link>
    </>
  );
}
