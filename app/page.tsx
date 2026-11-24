"use client";
import Link from "next/link";
import { PARTNERS, STATS, TEAM, EVENTS } from "@/lib/data";
import { fmtDate, useLang } from "@/lib/i18n";
import { CountUp, DateBox, RegButton, SecHead, upcomingEvents } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function Home() {
  const { t, tr, lang } = useLang();
  const next = upcomingEvents()[0];
  const info = EVENTS.find((e) => e.slug === "info-gun")!;
  const az = lang === "az";
  return (
    <>
      <div className="hero">
        <div className="rise">
          <div className="eyebrow">{az ? "Bakı Mühəndislik Universiteti · AI & Data Science" : "Baku Engineering University · AI & Data Science"}</div>
          <h1 style={{ marginTop: 14 }}>
            {az ? <>Datanı oxu.<br />AI ilə qur.<br /><em>BMU-da birlikdə.</em></> : <>Read the data.<br />Build with AI.<br /><em>Together at BEU.</em></>}
          </h1>
          <p className="lead">{az
            ? "DataTech süni intellekt və data elmi ilə maraqlanan BMU tələbələrinin icmasıdır. Dərslər, hackathonlar, real layihələr və mentorlarla birlikdə öyrənirik."
            : "DataTech is the community for BEU students into AI and data science. We learn together through lessons, hackathons, real projects and mentors."}</p>
          <div className="cta">
            <Link className="btn pri" href="/qosul">{t("join")}</Link>
            <Link className="btn sec" href="/tedbirler">{az ? "Tədbirlərə bax" : "See events"}</Link>
          </div>
          <div className="who">
            <div className="faces">{TEAM.slice(1, 5).map((m) => <img key={m.id} src={m.photo} alt="" width={32} height={32} />)}</div>
            <span><b className="num" style={{ color: "var(--fg)" }}>{STATS.members}+</b> {az ? "tələbə artıq bizimlədir" : "students already joined"}</span>
          </div>
        </div>
        {next && (
          <article className="panel hero-card rise" style={{ animationDelay: ".12s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="tag">{t("nextEvent")}</span></div>
            <div className="datebox">
              <DateBox iso={next.date} />
              <div><h3 style={{ fontSize: 20, lineHeight: 1.25 }}>{tr(next.title)}</h3><p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{next.time} · {tr(next.place)}</p></div>
            </div>
            <p className="muted" style={{ fontSize: 14 }}>{tr(next.desc)}</p>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span className="muted">{t("seats")}</span><span className="num">{next.capacity - next.registered} / {next.capacity}</span></div>
              <div className="seats"><i style={{ width: `${Math.round((next.registered / next.capacity) * 100)}%` }} /></div>
            </div>
            <RegButton slug={next.slug} full />
          </article>
        )}
      </div>

      <div className="stats">
        <div className="panel stat"><div className="num"><CountUp to={STATS.members} /><small>+</small></div><p>{t("members")}</p></div>
        <div className="panel stat"><div className="num"><CountUp to={STATS.events} /></div><p>{t("eventsN")}</p></div>
        <div className="panel stat"><div className="num"><CountUp to={STATS.faculties} /></div><p>{t("faculties")}</p></div>
      </div>

      <section>
        <SecHead eyebrow={t("about")} title={az ? "Nə edirik" : "What we do"} href="/haqqimizda" linkText={t("seeAll")} />
        <div className="about">
          <p className="big">{az
            ? "16 noyabr 2026-da qurulduq. Məqsədimiz sadədir: hər BMU tələbəsi data və AI ilə real bir şey qura bilsin və bunu başqaları ilə bölüşsün."
            : "We started on 16 November 2026. Our goal is simple: every BEU student should be able to build something real with data and AI, and share it."}</p>
          <div className="pillars">
            {[
              ["code", az ? "Açıq dərslər" : "Open lessons", az ? "Python, pandas, ML əsasları. Pulsuz." : "Python, pandas, ML basics. Free.", "/resurslar"],
              ["bolt", "Hackathon", az ? "Komanda qur, yarışlarda iştirak et." : "Form a team and compete.", "/yarislar"],
              ["people", az ? "Mentorluq" : "Mentoring", az ? "CV, LinkedIn və karyera üçün 1:1." : "1:1 help with CVs, LinkedIn and careers.", "/mentorlar"],
              ["chart", az ? "Layihələr" : "Projects", az ? "Real data ilə işlə, Demo Day-də göstər." : "Work with real data, show it at Demo Day.", "/layiheler"],
            ].map(([ic, h, p, href]) => (
              <Link key={h} href={href} className="panel pillar" style={{ textDecoration: "none" }}><Icon name={ic} /><b>{h}</b><p>{p}</p></Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SecHead eyebrow={az ? "Keçmiş tədbir" : "Past event"} title={tr(info.title)} href="/qalereya" linkText={az ? "Qalereya →" : "Gallery →"} />
        <div className="infoday">
          <figure><img src={info.gallery![0]} alt={az ? "İnfo gündə təqdimat" : "Info day talk"} loading="lazy" /></figure>
          <figure><img src={info.gallery![1]} alt={az ? "İnfo gündə komanda üzvü" : "Team member at info day"} loading="lazy" /></figure>
          <div className="panel idtext">
            <div><span className="tag">{fmtDate(info.date, lang)}</span><h3 style={{ fontSize: 22, marginTop: 12 }}>{az ? "İlk görüşümüz" : "Our first meetup"}</h3><p className="muted" style={{ marginTop: 8 }}>{tr(info.desc)}</p></div>
            <div><div className="stars" aria-label="5/5">★★★★★</div><p style={{ fontWeight: 600, marginTop: 4 }}>{az ? "Hər iştirakçı 5 ulduz verdi" : "Every attendee gave 5 stars"}</p></div>
          </div>
        </div>
      </section>

      <section>
        <SecHead eyebrow={t("team")} title={az ? "İdarə heyəti" : "Board"} href="/komanda" linkText={t("seeAll")} />
        <div className="team">
          {TEAM.map((m) => (
            <Link key={m.id} href={`/komanda#${m.id}`} className="panel member" style={{ textDecoration: "none" }}>
              <img src={m.photo} alt={m.name} loading="lazy" width={200} height={200} /><b>{m.name}</b><span>{tr(m.role)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SecHead eyebrow={t("partners")} title={az ? "Birlikdə güclüyük" : "Stronger together"} href="/terefdaslar" linkText={t("seeAll")} />
        <div className="partners">
          {PARTNERS.map((p) => <div key={p.id} className="panel partner">{p.logo && <img src={p.logo} alt="" />}{p.name}</div>)}
        </div>
      </section>

      <section className="panel join">
        <div><h2>{az ? "Qoşulmağa hazırsan?" : "Ready to join?"}</h2><p>{az ? "Yalnız BMU tələbələri üçün. Qeydiyyat 1 dəqiqə çəkir." : "For BEU students only. Signing up takes a minute."}</p></div>
        <Link className="btn" href="/qosul">{t("join")}</Link>
      </section>

      <footer>
        <span>© 2026 DataTech · {az ? "Bakı Mühəndislik Universiteti" : "Baku Engineering University"}</span>
        <span style={{ display: "flex", gap: 14, flexWrap: "wrap" }}><Link href="/elaqe">{t("contact")}</Link><Link href="/faq">{t("faq")}</Link><Link href="/rey">{t("feedback")}</Link></span>
      </footer>
    </>
  );
}
