"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { listRecords, type Rec } from "@/lib/store";
import { DemoBanner, PageHead, SignInGate, SubmitRow, useSubmit } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function Projects() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState<Rec[]>([]);
  useEffect(() => { listRecords("projects", { whereEq: ["approved", true] }).then(setItems).catch(() => {}); }, []);
  const { state, onSubmit } = useSubmit("projects", () => ({ approved: false, owner: user?.name, ownerUid: user?.uid }));
  const az = lang === "az";
  return (
    <>
      <PageHead eyebrow={t("projects")} title={az ? "Layihələr və Demo Day" : "Projects & Demo Day"} lead={az ? "Üzvlərin data və AI layihələri. İlk Demo Day: 22 may 2027." : "Member data and AI projects. First Demo Day: 22 May 2027."} />
      {items.length === 0 ? (
        <div className="panel empty"><Icon name="code" /><b>{az ? "Hələ təsdiqlənmiş layihə yoxdur" : "No approved projects yet"}</b><p>{az ? "İlk layihəni sən göndər. İdarə heyəti yoxlayandan sonra burada görünəcək." : "Be the first to submit. It appears here after the board reviews it."}</p></div>
      ) : (
        <div className="grid3">{items.map((p) => (
          <article key={p.id} className="panel box stack"><span className="tag">{String(p.topic || "AI")}</span><h3>{String(p.title)}</h3><p className="muted" style={{ fontSize: 14 }}>{String(p.summary)}</p><span className="note">{String(p.owner || "")}</span>
            {p.link ? <a href={String(p.link)} target="_blank" rel="noreferrer" style={{ color: "var(--blue-hi)", fontWeight: 600, fontSize: 14 }}>GitHub / Demo →</a> : null}</article>
        ))}</div>
      )}
      <section>
        <h2 style={{ marginBottom: 16 }}>{az ? "Layihəni göndər" : "Submit your project"}</h2>
        <DemoBanner />
        <SignInGate>
          <form className="panel box form" onSubmit={onSubmit} style={{ maxWidth: 680 }}>
            <div className="field-row"><label htmlFor="p-title">{az ? "Layihənin adı" : "Project title"}</label><input className="input" id="p-title" name="title" required /></div>
            <div className="field-row"><label htmlFor="p-sum">{az ? "Qısa təsvir" : "Short summary"}</label><textarea className="input" id="p-sum" name="summary" required /></div>
            <div className="grid2">
              <div className="field-row"><label htmlFor="p-topic">{az ? "Sahə" : "Area"}</label><select className="input" id="p-topic" name="topic">{["Data analizi", "Machine Learning", "NLP", "Computer Vision", "Dashboard", "Digər"].map((x) => <option key={x}>{x}</option>)}</select></div>
              <div className="field-row"><label htmlFor="p-link">GitHub / Demo</label><input className="input" id="p-link" name="link" type="url" placeholder="https://" /></div>
            </div>
            <div className="field-row"><label htmlFor="p-team">{az ? "Komanda üzvləri" : "Team members"}</label><input className="input" id="p-team" name="team" /></div>
            <SubmitRow state={state} />
          </form>
        </SignInGate>
      </section>
    </>
  );
}
