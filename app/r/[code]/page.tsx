"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { bump, getRecord } from "@/lib/store";
import { SITE } from "@/lib/data";

// Gizli izləmə linki: /r/<kod>. Skanı sayır və hədəf səhifəyə yönləndirir.
export default function Track({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const r = useRouter();
  useEffect(() => {
    (async () => {
      let target = "/";
      try {
        const link = await getRecord("links", code);
        if (link) { target = String(link.target || "/"); await bump("links", code, "hits", 1); }
      } catch {}
      // Xarici hədəf yalnız açar sözlə (açıq yönləndirmənin qarşısını almaq üçün).
      if (target === "@whatsapp" && SITE.whatsapp) { location.replace(SITE.whatsapp); return; }
      if (!target.startsWith("/")) target = "/";
      r.replace(target);
    })();
  }, [code, r]);
  return <div className="empty">…</div>;
}
