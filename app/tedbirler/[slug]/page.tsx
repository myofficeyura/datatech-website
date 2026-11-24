"use client";
import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { EVENTS } from "@/lib/data";
import { fmtDate, useLang } from "@/lib/i18n";
import { DateBox, RegButton } from "@/components/ui";
import { RateEvent } from "@/components/RateEvent";
import { Icon } from "@/components/Icon";

export default function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { tr, lang, t } = useLang();
  const e = EVENTS.find((x) => x.slug === slug);
  if (!e) notFound();
  const az = lang === "az";
  return (
    <div className="stack" style={{ gap: 16 }}>
      <Link href="/tedbirler" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>← {t("events")}</Link>
      <div className="cols">
        <div className="panel box stack">
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}><DateBox iso={e.date} /><h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>{tr(e.title)}</h1></div>
          <div className="ev" style={{ padding: 0 }}><div className="meta">
            <span><Icon name="clock" />{fmtDate(e.date, lang)}{e.time && `, ${e.time}`}</span>
            <span><Icon name="pin" />{tr(e.place)}</span>
          </div></div>
          <p style={{ fontSize: 16.5, lineHeight: 1.7 }}>{tr(e.desc)}</p>
          {e.gallery && <div className="gallery">{e.gallery.map((g) => <img key={g} src={g} alt="" />)}</div>}
        </div>
        {e.past ? <RateEvent e={e} /> : (
          <div className="panel box stack">
            <h3>{az ? "Qeydiyyat" : "Registration"}</h3>
            {e.capacity > 0 && <div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span className="muted">{t("seats")}</span><span className="num">{e.capacity - e.registered} / {e.capacity}</span></div>
              <div className="seats"><i style={{ width: `${Math.round((e.registered / e.capacity) * 100)}%` }} /></div></div>}
            <RegButton slug={e.slug} full />
            <p className="note">{az ? "Qeydiyyat üçün BMU hesabınla daxil olmalısan. Tədbirdə iştirak +200 xal verir." : "Sign in with your BEU account to register. Attending gives +200 points."}</p>
            <Link className="btn sec sm" href="/komanda-axtar">{t("teamfinder")}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
