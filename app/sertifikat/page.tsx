"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";

export default function Verify() {
  const { lang, t } = useLang();
  const r = useRouter();
  const [code, setCode] = useState("");
  return (
    <>
      <PageHead eyebrow={t("certificate")} title={lang === "az" ? "Sertifikatı yoxla" : "Verify a certificate"}
        lead={lang === "az" ? "Sertifikatın üzərindəki kodu daxil et (məs. DT-2026-0042)." : "Enter the code printed on the certificate (e.g. DT-2026-0042)."} />
      <form className="panel box form" style={{ maxWidth: 520 }} onSubmit={(e) => { e.preventDefault(); if (code.trim()) r.push(`/sertifikat/${encodeURIComponent(code.trim().toUpperCase())}`); }}>
        <div className="field-row"><label htmlFor="v-code">{lang === "az" ? "Kod" : "Code"}</label><input className="input" id="v-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="DT-2026-0000" required /></div>
        <button className="btn pri">{lang === "az" ? "Yoxla" : "Verify"}</button>
      </form>
    </>
  );
}
