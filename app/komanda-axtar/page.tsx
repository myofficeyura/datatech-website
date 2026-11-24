"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { listRecords, type Rec } from "@/lib/store";
import { DemoBanner, PageHead, SignInGate, SubmitRow, useSubmit } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function TeamFinder() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [rows, setRows] = useState<Rec[] | null>(null);
  const [filter, setFilter] = useState("");
  const load = () => listRecords("teamPosts", { order: "createdAt", dir: "desc", limit: 60 }).then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const { state, onSubmit } = useSubmit("teamPosts", () => ({ name: user?.name, contactUid: user?.uid }));
  useEffect(() => { if (state === "done") load(); }, [state]);
  const az = lang === "az";
  const shown = (rows || []).filter((r) => !filter || r.kind === filter);
  return (
    <>
      <PageHead eyebrow={t("teamfinder")} title={az ? "Komanda tap və ya komandana adam tap" : "Find a team or a teammate"} lead={az ? "Hackathon və layihələr üçün. Bacarıqlarını yaz, kimin nəyə ehtiyacı olduğunu gör." : "For hackathons and projects. Post your skills and see who needs what."} />
      <div className="tabs" style={{ alignSelf: "flex-start" }}>
        {[["", az ? "Hamısı" : "All"], ["looking", az ? "Komanda axtarır" : "Looking for team"], ["recruiting", az ? "Üzv axtarır" : "Recruiting"]].map(([k, v]) => <button key={k} type="button" className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{v}</button>)}
      </div>
      {rows && shown.length === 0 && <div className="panel empty"><Icon name="search" /><b>{az ? "Hələ elan yoxdur" : "No posts yet"}</b><p>{az ? "İlk elanı sən yerləşdir." : "Be the first to post."}</p></div>}
      <div className="grid3">
        {shown.map((r) => (
          <article key={r.id} className="panel box stack">
            <span className={"tag" + (r.kind === "recruiting" ? " a" : " g")} style={{ alignSelf: "flex-start" }}>{r.kind === "recruiting" ? (az ? "Üzv axtarır" : "Recruiting") : (az ? "Komanda axtarır" : "Looking for team")}</span>
            <b style={{ fontFamily: "var(--font-d)", fontSize: 17 }}>{String(r.name || "")}</b>
            <p className="muted" style={{ fontSize: 14 }}>{String(r.text || "")}</p>
            <p className="note"><b>{az ? "Bacarıqlar" : "Skills"}:</b> {String(r.skills || "")}</p>
            <p className="note" style={{ userSelect: "all" }}>{String(r.contact || "")}</p>
          </article>
        ))}
      </div>
      <section>
        <h2 style={{ marginBottom: 16 }}>{az ? "Elan yerləşdir" : "Post"}</h2>
        <DemoBanner />
        <SignInGate>
          <form className="panel box form" onSubmit={onSubmit} style={{ maxWidth: 640 }}>
            <div className="field-row"><label htmlFor="tf-kind">{az ? "Növ" : "Type"}</label><select className="input" id="tf-kind" name="kind">{[["looking", az ? "Komanda axtarıram" : "I'm looking for a team"], ["recruiting", az ? "Komandama üzv axtarıram" : "I'm recruiting"]].map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="field-row"><label htmlFor="tf-skills">{az ? "Bacarıqlar" : "Skills"}</label><input className="input" id="tf-skills" name="skills" placeholder="Python, pandas, dizayn..." required /></div>
            <div className="field-row"><label htmlFor="tf-text">{az ? "Qısa təsvir" : "Short description"}</label><textarea className="input" id="tf-text" name="text" required /></div>
            <div className="field-row"><label htmlFor="tf-contact">{az ? "Əlaqə (Telegram, Instagram və s.)" : "Contact (Telegram, Instagram, etc.)"}</label><input className="input" id="tf-contact" name="contact" required /></div>
            <SubmitRow state={state} />
          </form>
        </SignInGate>
      </section>
    </>
  );
}
