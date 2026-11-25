import type { Metadata } from "next";
import { ProblemBankView } from "@/components/views/views";
import { t } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/server-content";
import type { Lang } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  const { content } = await getContent();
  return pageMeta(content, lang, "/problem-bank", t(lang, "problemBank"));
}

export default function Page() {
  return <ProblemBankView />;
}
