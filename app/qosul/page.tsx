"use client";
import Link from "next/link";
import { FACULTIES, SITE } from "@/lib/data";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ALLOWED_DOMAIN } from "@/lib/firebase";
import { DemoBanner, PageHead, SignInGate, SubmitRow, useSubmit } from "@/components/ui";


export default function Join() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const [ref, setRef] = useState<string | null>(null);
  useEffect(() => { try { setRef(localStorage.getItem("dt-ref")); } catch {} }, []);
  const { state, onSubmit } = useSubmit("applications", () => ({ email: user?.email, uid: user?.uid, referredBy: ref }));
  const az = lang === "az";
  return (
    <>
      <PageHead eyebrow={t("join")} title={az ? "DataTech-ə qoşul" : "Join DataTech"}
        lead={az ? `Yalnız BMU tələbələri üçün.${ALLOWED_DOMAIN ? ` @${ALLOWED_DOMAIN} e-poçtu ilə daxil ol.` : ""} Təcrübə tələb olunmur.` : `For BEU students only.${ALLOWED_DOMAIN ? ` Sign in with your @${ALLOWED_DOMAIN} email.` : ""} No experience needed.`} />
      <DemoBanner />
      <SignInGate why={az ? "Əvvəlcə BMU e-poçtunla daxil ol, sonra qısa formanı doldur." : "First sign in with your BEU email, then fill in the short form."}>
        {state === "done" ? (
          <div className="panel signin-card">
            <h2>{az ? "Xoş gəldin!" : "Welcome!"}</h2>
            <p className="muted">{az ? "Müraciətin qəbul olundu. Kabinetində xallarını və dəvət linkini görə bilərsən." : "Your application is in. See your points and invite link in your cabinet."}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {SITE.whatsapp && <a className="btn pri" href={SITE.whatsapp} target="_blank" rel="noreferrer">{az ? "WhatsApp qrupuna qoşul" : "Join the WhatsApp group"}</a>}
              <Link className="btn sec" href="/kabinet">{t("cabinet")}</Link>
            </div>
          </div>
        ) : (
          <form className="panel box form" onSubmit={onSubmit} style={{ maxWidth: 640 }}>
            <div className="grid2">
              <div className="field-row"><label htmlFor="j-name">{az ? "Ad, soyad" : "Full name"}</label><input className="input" id="j-name" name="name" required defaultValue={user?.name} /></div>
              <div className="field-row"><label htmlFor="j-phone">{az ? "Telefon (WhatsApp)" : "Phone (WhatsApp)"}</label><input className="input" id="j-phone" name="phone" type="tel" placeholder="+994" /></div>
            </div>
            <div className="grid2">
              <div className="field-row"><label htmlFor="j-fac">{az ? "Fakültə" : "Faculty"}</label>
                {FACULTIES.length ? <select className="input" id="j-fac" name="faculty" required defaultValue="">{["", ...FACULTIES].map((f) => <option key={f} value={f} disabled={!f}>{f || (az ? "Seç" : "Choose")}</option>)}</select> : <input className="input" id="j-fac" name="faculty" required />}</div>
              <div className="field-row"><label htmlFor="j-year">{az ? "Kurs" : "Year"}</label>
                <select className="input" id="j-year" name="year" required defaultValue="">{["", "1", "2", "3", "4", "Magistr"].map((f) => <option key={f} value={f} disabled={!f}>{f || (az ? "Seç" : "Choose")}</option>)}</select></div>
            </div>
            <div className="field-row"><label htmlFor="j-level">{az ? "Səviyyən" : "Your level"}</label>
              <select className="input" id="j-level" name="level" defaultValue="Başlanğıc">{["Başlanğıc", "Bir az Python bilirəm", "Data analizi edirəm", "ML ilə işləmişəm"].map((f) => <option key={f}>{f}</option>)}</select></div>
            <div className="field-row"><label htmlFor="j-why">{az ? "Nə öyrənmək istəyirsən?" : "What do you want to learn?"}</label><textarea className="input" id="j-why" name="goals" /></div>
            {ref && <p className="note">{az ? `Səni dəvət edən: ${ref}` : `Invited by: ${ref}`}</p>}
            <SubmitRow state={state} />
          </form>
        )}
      </SignInGate>
    </>
  );
}
