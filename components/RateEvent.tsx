"use client";
import { useEffect, useState } from "react";
import type { EventItem } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { getRecord, setRecord } from "@/lib/store";

export function RateEvent({ e }: { e: EventItem }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const [mine, setMine] = useState(0);
  const [msg, setMsg] = useState("");
  const id = `${e.slug}_${user?.uid || "anon"}`;
  useEffect(() => { if (user) getRecord("ratings", id).then((r) => r && setMine(Number(r.stars) || 0)).catch(() => {}); }, [user, id]);
  const rate = async (s: number) => {
    setMine(s);
    try {
      if (user) await setRecord("ratings", id, { event: e.slug, uid: user.uid, stars: s });
      else { const { addRecord } = await import("@/lib/store"); await addRecord("ratings", { event: e.slug, stars: s }); }
      setMsg(lang === "az" ? `Təşəkkürlər! ${s} ulduz qeyd olundu.` : `Thanks! ${s} stars saved.`);
    } catch { setMsg(lang === "az" ? "Saxlanmadı, yenidən yoxla." : "Not saved, try again."); }
  };
  const r = e.rating ?? 0;
  return (
    <div className="panel box" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {r > 0 && <div>
        <h3 style={{ marginBottom: 6 }}>{lang === "az" ? "İştirakçı reytinqi" : "Attendee rating"}</h3>
        <div className="score"><span className="num">{r.toFixed(1)}</span><span className="stars">{"★".repeat(Math.round(r))}</span></div>
        {e.ratingCount ? <p className="muted" style={{ fontSize: 13 }}>{e.ratingCount} {lang === "az" ? "rəy" : "ratings"}</p> : null}
      </div>}
      <div style={r > 0 ? { borderTop: "1px solid var(--line)", paddingTop: 16 } : undefined}>
        <p style={{ fontWeight: 600 }}>{lang === "az" ? "Sən də qiymətləndir" : "Rate it yourself"}</p>
        <div className="rate">{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" aria-label={`${i}`} className={i <= mine ? "on" : ""} onClick={() => rate(i)}>★</button>)}</div>
        <p className="muted" style={{ fontSize: 13 }}>{msg || (lang === "az" ? "Rəy forması hər zaman açıqdır." : "Feedback is always open.")}</p>
      </div>
    </div>
  );
}
