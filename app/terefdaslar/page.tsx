"use client";
import Link from "next/link";
import { PARTNERS } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";

export default function Partners() {
  const { t, tr, lang } = useLang();
  const az = lang === "az";
  return (
    <>
      <PageHead eyebrow={t("partners")} title={az ? "Tərəfdaşlar və sponsorlar" : "Partners & sponsors"} lead={az ? "BMU icmaları ittifaqı: DevTech, InnoTech, DataTech, CyberTech." : "The BEU community alliance: DevTech, InnoTech, DataTech, CyberTech."} />
      <div className="grid3">
        {PARTNERS.map((p) => (
          <div key={p.id} className="panel box stack" style={{ alignItems: "flex-start" }}>
            <div className="partner" style={{ height: 64, justifyContent: "flex-start", padding: 0 }}>{p.logo && <img src={p.logo} alt="" />}{p.name}</div>
            <p className="muted">{tr(p.desc)}</p>
          </div>
        ))}
      </div>
      <section className="panel join">
        <div><h2>{az ? "Sponsor olmaq istəyirsən?" : "Want to sponsor?"}</h2><p>{az ? "Hackathon, workshop və ya mükafat fondu ilə dəstək ol." : "Support a hackathon, workshop or prize fund."}</p></div>
        <Link className="btn" href="/elaqe">{t("contact")}</Link>
      </section>
    </>
  );
}
