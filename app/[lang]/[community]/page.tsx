import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommunityView } from "@/components/views/views";
import { pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/server-content";
import { COMMUNITY_IDS, isCommunityId, type Lang } from "@/lib/types";
import { tl } from "@/lib/utils";

export function generateStaticParams() {
  return COMMUNITY_IDS.map((community) => ({ community }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; community: string }> }): Promise<Metadata> {
  const { lang, community } = (await params) as { lang: Lang; community: string };
  if (!isCommunityId(community)) return {};
  const { content } = await getContent();
  const c = content.communities[community];
  return pageMeta(content, lang, `/${community}`, c.name, tl(c.hero.subtitle, lang) || `${c.name} — ${tl(c.field, lang)}`);
}

export default async function Page({ params }: { params: Promise<{ community: string }> }) {
  const { community } = await params;
  if (!isCommunityId(community)) notFound();
  return <CommunityView id={community} />;
}
