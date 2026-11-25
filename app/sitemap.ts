import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getContent } from "@/lib/server-content";
import { COMMUNITY_IDS } from "@/lib/types";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { content } = await getContent();
  const paths = ["/", ...COMMUNITY_IDS.map((c) => `/${c}`), "/events", "/problem-bank", "/team", "/partners", "/faq", "/contact", ...content.events.map((e) => `/events/${e.slug}`)];
  return paths.map((p) => {
    const az = `${SITE_URL}${p}`;
    const en = `${SITE_URL}/en${p === "/" ? "" : p}`;
    return { url: az, lastModified: new Date(), changeFrequency: "weekly", priority: p === "/" ? 1 : 0.7, alternates: { languages: { az, en } } };
  });
}
