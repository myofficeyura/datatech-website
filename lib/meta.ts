import type { Metadata } from "next";
import { SITE_URL } from "./config";
import type { Content, Lang } from "./types";
import { tl } from "./utils";

/** Hər səhifə üçün metadata: başlıq, təsvir, kanonik və dil alternativləri, OG şəkli. */
export function pageMeta(content: Content, lang: Lang, path: string, title: string | null, description?: string): Metadata {
  const site = tl(content.site.name, lang);
  const desc = description || tl(content.site.hero.subtitle, lang);
  const p = path === "/" ? "" : path;
  const az = `${SITE_URL}${p || "/"}`;
  const en = `${SITE_URL}/en${p}`;
  const fullTitle = title ? `${title} · ${site}` : site;
  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: lang === "az" ? az : en, languages: { az, en, "x-default": az } },
    openGraph: { title: fullTitle, description: desc, url: lang === "az" ? az : en, siteName: site, locale: lang === "az" ? "az_AZ" : "en_US", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: site }] },
    twitter: { card: "summary_large_image", title: fullTitle, description: desc, images: ["/og.png"] },
  };
}
