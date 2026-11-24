"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";
import { Icon } from "@/components/Icon";

type Item = { title: string; link: string; date: string; source: string };

export default function News() {
  const { t, lang } = useLang();
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => { fetch("/api/news").then((r) => r.json()).then((j) => setItems(j.items || [])).catch(() => setItems([])); }, []);
  const az = lang === "az";
  const ago = (iso: string) => {
    if (!iso) return "";
    const h = Math.round((Date.now() - new Date(iso).getTime()) / 36e5);
    if (h < 24) return az ? `${Math.max(1, h)} saat əvvəl` : `${Math.max(1, h)}h ago`;
    const d = Math.round(h / 24); return az ? `${d} gün əvvəl` : `${d}d ago`;
  };
  return (
    <>
      <PageHead eyebrow={t("news")} title={az ? "AI dünyasında nə var" : "What's new in AI"} lead={az ? "Etibarlı mənbələrdən avtomatik toplanır, hər 3 saatdan bir yenilənir. Xəbərlər ingiliscədir." : "Collected automatically from trusted sources, refreshed every 3 hours."} />
      {items === null && <div className="empty">{t("loading")}</div>}
      {items?.length === 0 && <div className="panel empty"><Icon name="news" /><b>{az ? "Xəbərlər hazırda yüklənmədi" : "News couldn't be loaded right now"}</b><p>{az ? "Bir az sonra yenidən bax." : "Check back shortly."}</p></div>}
      <div className="grid2">
        {items?.map((i) => (
          <a key={i.link} href={i.link} target="_blank" rel="noreferrer" className="panel news-item">
            <small>{i.source} · {ago(i.date)}</small>
            <b style={{ fontSize: 16, lineHeight: 1.35 }}>{i.title}</b>
          </a>
        ))}
      </div>
    </>
  );
}
