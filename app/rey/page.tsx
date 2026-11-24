"use client";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { DemoBanner, PageHead, SubmitRow, useSubmit } from "@/components/ui";

export default function Feedback() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const [stars, setStars] = useState(0);
  const { state, onSubmit } = useSubmit("feedback", () => ({ stars, uid: user?.uid ?? null }));
  const az = lang === "az";
  return (
    <>
      <PageHead eyebrow={t("feedback")} title={az ? "Fikrini bildir" : "Tell us what you think"} lead={az ? "Bu forma həmişə açıqdır. Adını yazmaq məcburi deyil. İdarə heyəti hər həftə oxuyur." : "This form is always open and can be anonymous. The board reads it every week."} />
      <DemoBanner />
      <form className="panel box form" onSubmit={onSubmit} style={{ maxWidth: 640 }}>
        <div className="field-row"><label>{az ? "Ümumi qiymət" : "Overall rating"}</label>
          <div className="rate">{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" aria-label={`${i}`} className={i <= stars ? "on" : ""} onClick={() => setStars(i)}>★</button>)}</div></div>
        <div className="field-row"><label htmlFor="f-about">{az ? "Nə haqqında?" : "About what?"}</label>
          <select className="input" id="f-about" name="about">{(az ? ["Ümumi", "Tədbir", "Workshop", "Sayt", "Təklif", "Şikayət"] : ["General", "Event", "Workshop", "Website", "Idea", "Complaint"]).map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="field-row"><label htmlFor="f-text">{az ? "Fikrin" : "Your feedback"}</label><textarea className="input" id="f-text" name="text" required /></div>
        <div className="field-row"><label htmlFor="f-name">{az ? "Ad (istəyə bağlı)" : "Name (optional)"}</label><input className="input" id="f-name" name="name" /></div>
        <SubmitRow state={state} />
      </form>
    </>
  );
}
