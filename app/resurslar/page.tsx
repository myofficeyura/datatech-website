"use client";
import { RESOURCES } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function Resources() {
  const { tr, t, lang } = useLang();
  return (
    <>
      <PageHead eyebrow={t("resources")} title={lang === "az" ? "Öyrənmək üçün resurslar" : "Learning resources"} lead={lang === "az" ? "İdarə heyətinin seçdiyi pulsuz materiallar. Dərs slaydları və notebooklar da burada olacaq." : "Free material picked by the board. Lesson slides and notebooks will live here too."} />
      <div className="grid2">
        {RESOURCES.map((c) => (
          <div key={c.cat.az} className="panel box">
            <h3>{tr(c.cat)}</h3>
            <div className="list">
              {c.items.map((i) => (
                <a key={i.url} className="row" href={i.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  <Icon name="link" size={20} style={{ color: "var(--blue-hi)" }} /><div className="grow"><b>{i.title}</b><span>{tr(i.note)}</span></div><Icon name="arrow" size={16} />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
