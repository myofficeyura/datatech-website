"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

// Dəvət linki: /d/<kod>. Kodu yadda saxlayır və qoşulma səhifəsinə aparır.
export default function Invite({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const r = useRouter();
  useEffect(() => {
    try { localStorage.setItem("dt-ref", code.slice(0, 32)); } catch {}
    r.replace("/qosul");
  }, [code, r]);
  return <div className="empty">…</div>;
}
