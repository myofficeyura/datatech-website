"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { SignInGate } from "@/components/ui";
import { doCheckin } from "@/lib/checkin";
import { getRecord } from "@/lib/store";

// Tədbir / dərs check-in: /c/<kod>. Üzv BMU hesabı ilə daxil olur, iştirakı bir dəfə yazılır.
const TEXT = {
  ok: ["Qeyd olundun ✓", "İştirakın aktivlik reytinqinə əlavə edildi. Xoş keçsin!"],
  dup: ["Artıq qeyd olunmusan ✓", "Bu tədbir üçün iştirakın əvvəlcədən yazılıb."],
  closed: ["Check-in bağlıdır", "Bu tədbirin qeydiyyatı artıq bağlanıb."],
  missing: ["Kod tapılmadı", "QR kodu yenidən skan et və ya təşkilatçıya yaz."],
  error: ["Xəta baş verdi", "İnterneti yoxla və yenidən cəhd et."],
} as const;

function Inner({ code }: { code: string }) {
  const { user } = useAuth();
  const [st, setSt] = useState<keyof typeof TEXT | null>(null);
  const [title, setTitle] = useState("");
  useEffect(() => {
    if (!user) return;
    getRecord("sessions", code).then((s) => s && setTitle(String(s.title || ""))).catch(() => {});
    doCheckin(code, user.uid, user.email).then(setSt).catch(() => setSt("error"));
  }, [code, user]);
  if (!st) return <div className="empty">…</div>;
  const [h, p] = TEXT[st];
  return (
    <div className="panel box" style={{ maxWidth: 460, margin: "40px auto", textAlign: "center" }}>
      {title && <div className="eyebrow">{title}</div>}
      <h1 style={{ fontSize: 28, margin: "8px 0" }}>{h}</h1>
      <p className="note">{p}</p>
      <Link className="btn sec" href="/kabinet" style={{ marginTop: 12 }}>Kabinetə keç</Link>
    </div>
  );
}

export default function Checkin({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  return <SignInGate why="İştirakını qeyd etmək üçün BMU hesabınla daxil ol."><Inner code={code} /></SignInGate>;
}
