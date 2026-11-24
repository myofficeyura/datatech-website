"use client";
import Link from "next/link";
import { FAQ } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { Empty, PageHead } from "@/components/ui";

export default function Faq() {
  const { tr, t, lang } = useLang();
  return (
    <>
      <PageHead eyebrow={t("faq")} title={lang === "az" ? "Tez-tez verilən suallar" : "Frequently asked questions"} />
      {FAQ.length === 0 && <Empty />}
      <div className="stack" style={{ maxWidth: 760 }}>
        {FAQ.map((f) => (
          <details key={f.q.az} className="panel box">
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 16 }}>{tr(f.q)}</summary>
            <p className="muted" style={{ marginTop: 10 }}>{tr(f.a)}</p>
          </details>
        ))}
      </div>
      <p className="muted">{lang === "az" ? "Cavab tapmadın? " : "Didn't find it? "}<Link href="/elaqe" style={{ color: "var(--blue-hi)" }}>{t("contact")}</Link></p>
    </>
  );
}
