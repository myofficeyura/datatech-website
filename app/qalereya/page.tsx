"use client";
import { useState } from "react";
import { EVENTS } from "@/lib/data";
import { fmtDate, useLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";

export default function Gallery() {
  const { tr, t, lang } = useLang();
  const [open, setOpen] = useState<string | null>(null);
  const withPhotos = EVENTS.filter((e) => e.gallery?.length);
  return (
    <>
      <PageHead eyebrow={t("gallery")} title={lang === "az" ? "Fotolar" : "Photos"} />
      {withPhotos.map((e) => (
        <section key={e.slug} className="stack">
          <div><h2 style={{ fontSize: 24 }}>{tr(e.title)}</h2><p className="note">{fmtDate(e.date, lang)}</p></div>
          <div className="grid3">
            {e.gallery!.map((g) => <button key={g} type="button" onClick={() => setOpen(g)} style={{ border: 0, padding: 0, background: "none", borderRadius: 14, overflow: "hidden" }}><img src={g} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", display: "block" }} /></button>)}
          </div>
        </section>
      ))}
      {open && (
        <div role="dialog" onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,.85)", display: "grid", placeItems: "center", padding: 16 }}>
          <img src={open} alt="" style={{ maxHeight: "90vh", maxWidth: "100%", borderRadius: 12 }} />
        </div>
      )}
    </>
  );
}
