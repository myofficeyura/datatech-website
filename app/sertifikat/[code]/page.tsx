"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { fmtDate, useLang } from "@/lib/i18n";
import { firebaseEnabled } from "@/lib/firebase";
import { getRecord, type Rec } from "@/lib/store";
import { Icon } from "@/components/Icon";

const DEMO: Record<string, Rec> = {};

export default function Cert({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = use(params);
  const code = decodeURIComponent(raw).toUpperCase();
  const { lang } = useLang();
  const [c, setC] = useState<Rec | null | undefined>(undefined);
  useEffect(() => {
    if (!firebaseEnabled) { setC(DEMO[code] ?? null); return; }
    getRecord("certificates", code).then(setC).catch(() => setC(null));
  }, [code]);
  useEffect(() => { if (c && new URLSearchParams(location.search).get("print")) setTimeout(() => window.print(), 400); }, [c]);
  const az = lang === "az";
  if (c === undefined) return <div className="empty">…</div>;
  if (!c) return (
    <div className="panel empty"><Icon name="x" /><h2>{az ? "Sertifikat tapılmadı" : "Certificate not found"}</h2><p>{az ? `"${code}" kodu ilə sertifikat yoxdur. Kodu yoxla.` : `No certificate with code "${code}". Check the code.`}</p><Link className="btn sec sm" href="/sertifikat">{az ? "Yenidən yoxla" : "Try again"}</Link></div>
  );
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="banner" style={{ background: "rgba(18,184,134,.12)", color: "var(--green)" }}>✓ {az ? "Bu sertifikat həqiqidir və DataTech tərəfindən verilib." : "This certificate is genuine and was issued by DataTech."}</div>
      <article className="panel certificate" style={{ padding: "48px 32px", textAlign: "center", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", border: "2px solid var(--blue)" }}>
        <img src="/img/logo-blue.png" alt="" width={48} height={61} />
        <div className="eyebrow">DataTech · {az ? "Bakı Mühəndislik Universiteti" : "Baku Engineering University"}</div>
        <h1 style={{ fontSize: "clamp(28px,4vw,40px)" }}>{az ? "Sertifikat" : "Certificate"}</h1>
        <p className="muted">{az ? "Bu sertifikat təqdim olunur" : "This certificate is awarded to"}</p>
        <p style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 800 }}>{String(c.name)}</p>
        <p>{String(c.title)}</p>
        <p className="muted">{fmtDate(String(c.date), lang)}</p>
        <code style={{ fontFamily: "var(--font-m)", color: "var(--blue-hi)" }}>{c.id}</code>
      </article>
      <button className="btn sec sm" type="button" style={{ alignSelf: "flex-start" }} onClick={() => window.print()}><Icon name="dl" size={16} />{az ? "PDF kimi yüklə" : "Save as PDF"}</button>
    </div>
  );
}
