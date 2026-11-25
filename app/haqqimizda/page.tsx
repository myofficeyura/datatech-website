"use client";
import Link from "next/link";
import { SITE, STATS } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { PageHead, SecHead } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function About() {
  const { lang, t } = useLang();
  const az = lang === "az";
  return (
    <>
      <PageHead eyebrow={t("about")} title={az ? "DataTech nədir?" : "What is DataTech?"}
        lead={az ? "Bakı Mühəndislik Universitetinin süni intellekt və data elmi tələbə icması. 16 noyabr 2026-da qurulub." : "The AI and data science student community of Baku Engineering University, founded on 16 November 2026."} />
      <div className="grid2">
        <div className="panel box stack">
          <h3 style={{ fontSize: 20 }}>{az ? "Missiyamız" : "Our mission"}</h3>
          <p className="muted">{az
            ? "BMU-da data və AI ilə maraqlanan hər tələbəyə öyrənmək, sınamaq və öz işini göstərmək üçün yer yaratmaq. Biz nəzəriyyədən çox real layihəyə, tək öyrənməkdən çox birlikdə qurmağa inanırıq."
            : "Give every BEU student interested in data and AI a place to learn, experiment and show their work. We value real projects over theory, and building together over learning alone."}</p>
        </div>
        <div className="panel box stack">
          <h3 style={{ fontSize: 20 }}>{az ? "Rəqəmlərlə" : "In numbers"}</h3>
          <div className="list">
            {([[az ? "Üzv" : "Members", STATS.members, "+"], [az ? "Keçirilən tədbir" : "Events held", STATS.events, ""], [az ? "Fakültə" : "Faculties", STATS.faculties, ""], [az ? "Orta rəy" : "Avg rating", STATS.rating, " ★"]] as const).filter(([, n]) => n > 0).map(([k, n, suf]) => [k, `${n}${suf}`]).map(([k, v]) => (
              <div className="row" key={String(k)}><div className="grow"><b>{k}</b></div><span className="pts">{v}</span></div>
            ))}
          </div>
        </div>
      </div>
      <section>
        <SecHead title={az ? "Nə edirik" : "What we do"} />
        <div className="grid3">
          {[
            ["code", az ? "Açıq dərslər və workshoplar" : "Open lessons & workshops", az ? "Python, pandas, vizualizasiya, ML əsasları. Başlanğıc səviyyədən." : "Python, pandas, visualisation, ML basics. Beginner friendly."],
            ["bolt", az ? "Hackathon və yarışlar" : "Hackathons & competitions", az ? "Daxili mini-hackathonlar, tərəfdaşlarla açıq yarışlar, Kaggle komandaları." : "Internal mini-hackathons, open contests with partners, Kaggle teams."],
            ["people", az ? "Mentorluq və karyera" : "Mentoring & careers", az ? "CV, LinkedIn, təcrübə müraciətləri üçün 1:1 dəstək." : "1:1 help with CVs, LinkedIn and internship applications."],
            ["chart", az ? "Layihələr və Demo Day" : "Projects & Demo Day", az ? "Komandalarla real data layihələri və ictimai təqdimat." : "Real data projects in teams, shown publicly."],
            ["trophy", az ? "Reytinq və mükafatlar" : "Leaderboard & rewards", az ? "Aktivliyə görə xallar, nişanlar və aylıq mükafat." : "Points for activity, badges and a monthly reward."],
            ["hand", az ? "İcmalar ittifaqı" : "Community alliance", az ? "Innoventure, Devora və ShellShock ilə birgə tədbirlər." : "Joint events with Innoventure, Devora and ShellShock."],
          ].map(([ic, h, p]) => <div key={h} className="panel pillar"><Icon name={ic} /><b>{h}</b><p>{p}</p></div>)}
        </div>
      </section>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="btn pri" href="/qosul">{t("join")}</Link>
        <Link className="btn sec" href="/yol-xeritesi">{t("roadmap")}</Link>
        <Link className="btn sec" href="/komanda">{t("team")}</Link>
      </div>
    </>
  );
}
