import type { Metadata } from "next";
import { EventView } from "@/components/views/views";
import { pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/server-content";
import type { Lang } from "@/lib/types";
import { tl } from "@/lib/utils";

// Admin paneldən əlavə olunan yeni tədbirlər də açılsın (ISR).
export const dynamicParams = true;
export async function generateStaticParams() {
  const { content } = await getContent();
  return content.events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const { content } = await getContent();
  const e = content.events.find((x) => x.slug === slug);
  if (!e) return pageMeta(content, lang, `/events/${slug}`, "404");
  const meta = pageMeta(content, lang, `/events/${slug}`, tl(e.title, lang), tl(e.summary, lang));
  if (e.cover) meta.openGraph = { ...meta.openGraph, images: [{ url: e.cover }] };
  return meta;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EventView slug={decodeURIComponent(slug)} />;
}
