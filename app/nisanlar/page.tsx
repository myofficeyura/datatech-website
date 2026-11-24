"use client";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import { BadgeGrid } from "@/components/BadgeGrid";

export default function Badges() {
  const { lang } = useLang();
  const { user } = useAuth();
  return (
    <>
      <PageHead eyebrow={lang === "az" ? "Nişanlar" : "Badges"} title={lang === "az" ? "Nişanları necə qazanmaq olar" : "How to earn badges"} />
      <div className="panel box"><BadgeGrid have={user?.badges || []} showHow /></div>
    </>
  );
}
