"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MODE, subscribeContent } from "@/lib/db";
import { t as tr, type DictKey } from "@/lib/i18n";
import type { Content, Lang } from "@/lib/types";

type Ctx = { content: Content; lang: Lang; t: (k: DictKey) => string };
const SiteCtx = createContext<Ctx | null>(null);

export function SiteProvider({ initial, lang, children }: { initial: Content; lang: Lang; children: React.ReactNode }) {
  const [content, setContent] = useState(initial);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      unsub = subscribeContent((c) => c && setContent(c), (e) => console.warn("[live]", e.message));
    };
    if (MODE === "demo") start();
    else {
      // Firebase SDK-nı ilk görüntüdən sonra yüklə (performans).
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 3000 });
      else setTimeout(start, 1500);
    }
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  // Favicon admin paneldən dəyişəndə canlı yenilənsin.
  useEffect(() => {
    const fav = content.site.favicon;
    if (!fav) return;
    let link = document.querySelector<HTMLLinkElement>("link[data-dyn-icon]");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.setAttribute("data-dyn-icon", "");
      document.head.appendChild(link);
    }
    link.href = fav;
  }, [content.site.favicon]);

  const value = useMemo<Ctx>(() => ({ content, lang, t: (k) => tr(lang, k) }), [content, lang]);
  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export function useSite() {
  const v = useContext(SiteCtx);
  if (!v) throw new Error("SiteProvider yoxdur");
  return v;
}
