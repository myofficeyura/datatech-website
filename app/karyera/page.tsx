"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { listRecords, type Rec } from "@/lib/store";
import { PageHead } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function Career() {
  const { t, lang } = useLang();
  const [items, setItems] = useState<Rec[] | null>(null);
  useEffect(() => { listRecords("careers", { order: "createdAt", dir: "desc", limit: 50 }).then(setItems).catch(() => setItems([])); }, []);
  const az = lang === "az";
  return (
    <>
      <PageHead eyebrow={t("career")} title={az ? "Karyera lövhəsi" : "Career board"} lead={az ? "Təcrübə proqramları, iş elanları və təqaüdlər. Elanları idarə heyəti yoxlayıb əlavə edir." : "Internships, jobs and scholarships, checked and posted by the board."} />
      {items && items.length === 0 && (
        <div className="panel empty"><Icon name="brief" /><b>{az ? "Hazırda açıq elan yoxdur" : "No open listings right now"}</b><p>{az ? "Yeni elanlar əlavə olunanda burada görünəcək. CV-ni hazırlamaq üçün mentor görüşü götürə bilərsən." : "New listings will show here. Meanwhile, book a mentor session to polish your CV."}</p></div>
      )}
      <div className="stack">
        {items?.map((j) => (
          <a key={j.id} href={String(j.url || "#")} target="_blank" rel="noreferrer" className="panel news-item">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><span className="tag">{String(j.kind || "Təcrübə")}</span>{j.deadline ? <span className="tag a">{az ? "Son tarix" : "Deadline"}: {String(j.deadline)}</span> : null}</div>
            <b style={{ fontSize: 17, fontFamily: "var(--font-d)" }}>{String(j.title)}</b>
            <small>{String(j.company || "")}</small>
          </a>
        ))}
      </div>
    </>
  );
}
