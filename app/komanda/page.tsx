"use client";
import { TEAM } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";

export default function Team() {
  const { lang, tr, t } = useLang();
  return (
    <>
      <PageHead eyebrow={t("team")} title={lang === "az" ? "İdarə heyəti" : "The board"} lead={lang === "az" ? "DataTech-i quran və idarə edən 6 tələbə." : "The six students who run DataTech."} />
      <div className="grid3">
        {TEAM.map((m) => (
          <article key={m.id} id={m.id} className="panel box" style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 80 }}>
            <img src={m.photo} alt={m.name} width={400} height={400} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12 }} />
            <div><h3 style={{ fontSize: 19 }}>{m.name}</h3><span className="tag" style={{ marginTop: 6 }}>{tr(m.role)}</span></div>
            <p className="muted" style={{ fontSize: 14 }}>{tr(m.bio)}</p>
          </article>
        ))}
      </div>
    </>
  );
}
