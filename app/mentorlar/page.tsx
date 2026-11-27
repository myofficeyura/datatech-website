"use client";
import { useState } from "react";
import { MENTORS } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { DemoBanner, Empty, MentorCard, PageHead, SignInGate, SubmitRow, useSubmit } from "@/components/ui";

export default function Mentors() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [pick, setPick] = useState<{ id: string; slot: string } | null>(null);
  const { state, onSubmit } = useSubmit("bookings", () => ({ mentor: pick?.id, slot: pick?.slot, name: user?.name, email: user?.email }));
  const az = lang === "az";
  const booking = MENTORS.some((m) => m.slots.length > 0);
  return (
    <>
      <PageHead eyebrow={t("mentors")} title={az ? "Mentorlarımız" : "Our mentors"} lead={az ? "Data, maşın öyrənməsi və süni intellekt sahəsində təcrübəli mütəxəssislər üzvlərimizə yol göstərir." : "Experienced professionals in data, machine learning and AI guide our members."} />
      {MENTORS.length === 0 ? <Empty text={{ az: "Mentorlar tezliklə əlavə olunacaq.", en: "Mentors will be added soon." }} /> : (
        <div className="mentors">{MENTORS.map((m) => <MentorCard key={m.id} m={m} />)}</div>
      )}
      {booking && <>
        <h2 style={{ fontSize: 22 }}>{az ? "1:1 görüş" : "Book a 1:1"}</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MENTORS.flatMap((m) => m.slots.map((s) => (
            <button key={m.id + s} type="button" className={"btn sm " + (pick?.id === m.id && pick.slot === s ? "pri" : "sec")} onClick={() => setPick({ id: m.id, slot: s })}>{m.name.split(" ")[0]} · {s}</button>
          )))}
        </div>
        <DemoBanner />
        <SignInGate>
          <form className="panel box form" onSubmit={onSubmit} style={{ maxWidth: 640 }}>
            <p><b>{pick ? `${MENTORS.find((m) => m.id === pick.id)?.name} · ${pick.slot}` : (az ? "Əvvəlcə yuxarıdan vaxt seç" : "Pick a slot above first")}</b></p>
            <div className="field-row"><label htmlFor="b-topic">{az ? "Nə barədə danışmaq istəyirsən?" : "What do you want to discuss?"}</label><textarea className="input" id="b-topic" name="topic" required /></div>
            {pick ? <SubmitRow state={state} /> : null}
          </form>
        </SignInGate>
      </>}
    </>
  );
}
