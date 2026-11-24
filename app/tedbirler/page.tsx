"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang, fmtDate } from "@/lib/i18n";
import { Empty, EventCard, PageHead, pastEvents, upcomingEvents } from "@/components/ui";
import { RateEvent } from "@/components/RateEvent";

export default function Events() {
  const { t, tr, lang } = useLang();
  const [tab, setTab] = useState<"up" | "past">("up");
  useEffect(() => { if (location.hash === "#kecmis") setTab("past"); }, []);
  return (
    <>
      <PageHead eyebrow={t("events")} title={lang === "az" ? "Gəl, öyrən, qur" : "Come, learn, build"}>
        <div className="tabs" role="tablist" style={{ alignSelf: "flex-start", marginTop: 8 }}>
          <button type="button" role="tab" aria-selected={tab === "up"} className={tab === "up" ? "on" : ""} onClick={() => setTab("up")}>{t("upcoming")}</button>
          <button type="button" role="tab" aria-selected={tab === "past"} className={tab === "past" ? "on" : ""} onClick={() => setTab("past")}>{t("past")}</button>
        </div>
      </PageHead>
      {tab === "up" ? (
        upcomingEvents().length ? <div className="evgrid" style={{ marginTop: 0 }}>{upcomingEvents().map((e) => <EventCard key={e.slug} e={e} />)}</div> : <Empty text={{ az: "Yeni tədbirlər tezliklə elan olunacaq.", en: "New events will be announced soon." }} />
      ) : (
        <div className="stack">
          {pastEvents().map((e) => (
            <div key={e.slug} className="past" style={{ marginTop: 0 }}>
              <div className="panel box">
                <span className="tag">{fmtDate(e.date, lang)}</span>
                <Link href={`/tedbirler/${e.slug}`} style={{ textDecoration: "none" }}><h3 style={{ fontSize: 22, marginTop: 10 }}>{tr(e.title)}</h3></Link>
                <p className="muted" style={{ fontSize: 14, margin: "4px 0 14px" }}>{tr(e.desc)}</p>
                <div className="gallery">{e.gallery?.map((g) => <img key={g} src={g} alt="" loading="lazy" />)}</div>
              </div>
              <RateEvent e={e} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
