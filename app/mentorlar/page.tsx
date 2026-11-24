"use client";
import { useState } from "react";
import { MENTORS } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { DemoBanner, Empty, PageHead, SignInGate, SubmitRow, useSubmit } from "@/components/ui";

export default function Mentors() {
  const { tr, t, lang } = useLang();
  const { user } = useAuth();
  const [pick, setPick] = useState<{ id: string; slot: string } | null>(null);
  const { state, onSubmit } = useSubmit("bookings", () => ({ mentor: pick?.id, slot: pick?.slot, name: user?.name, email: user?.email }));
  const az = lang === "az";
  return (
    <>
      <PageHead eyebrow={t("mentors")} title={az ? "1:1 mentor görüşü" : "Book a 1:1 mentor"} lead={az ? "Mentoru və vaxtı seç, mövzunu yaz. Mentor təsdiq edəndə sənə yazacaq. Görüşlər 30 dəqiqədir." : "Pick a mentor and a slot, describe your topic. The mentor will confirm. Sessions are 30 minutes."} />
      {MENTORS.length === 0 && <Empty text={{ az: "Mentor vaxtları tezliklə əlavə olunacaq.", en: "Mentor slots will be added soon." }} />}
      <div className="grid3">
        {MENTORS.map((m) => (
          <article key={m.id} className="panel box stack">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}><img src={m.photo} alt="" width={56} height={56} style={{ borderRadius: 14, objectFit: "cover" }} /><div><b style={{ fontFamily: "var(--font-d)" }}>{m.name}</b><p className="note">{tr(m.topics)}</p></div></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {m.slots.map((s) => <button key={s} type="button" className={"btn sm " + (pick?.id === m.id && pick.slot === s ? "pri" : "sec")} onClick={() => setPick({ id: m.id, slot: s })}>{s}</button>)}
            </div>
          </article>
        ))}
      </div>
      <p className="note">{az ? "Sənayədən mentorlar tezliklə əlavə olunacaq. Mentor olmaq istəyirsənsə, Əlaqə səhifəsindən yaz." : "Industry mentors are coming soon. Want to mentor? Write via the Contact page."}</p>
      <DemoBanner />
      <SignInGate>
        <form className="panel box form" onSubmit={onSubmit} style={{ maxWidth: 640 }}>
          <p><b>{pick ? `${MENTORS.find((m) => m.id === pick.id)?.name} · ${pick.slot}` : (az ? "Əvvəlcə yuxarıdan vaxt seç" : "Pick a slot above first")}</b></p>
          <div className="field-row"><label htmlFor="b-topic">{az ? "Nə barədə danışmaq istəyirsən?" : "What do you want to discuss?"}</label><textarea className="input" id="b-topic" name="topic" required /></div>
          {pick ? <SubmitRow state={state} /> : null}
        </form>
      </SignInGate>
    </>
  );
}
