"use client";
import Link from "next/link";
import { POSTS } from "@/lib/data";
import { fmtDate, useLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";

export default function Blog() {
  const { tr, t, lang } = useLang();
  return (
    <>
      <PageHead eyebrow={t("blog")} title={lang === "az" ? "Bloq" : "Blog"} lead={lang === "az" ? "Tədbirlərdən qeydlər, dərslər və icma xəbərləri." : "Notes from events, lessons and community news."} />
      <div className="grid2">
        {[...POSTS].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="panel post">
            <span className="note">{fmtDate(p.date, lang)} · {p.author}</span>
            <h3 style={{ fontSize: 21 }}>{tr(p.title)}</h3>
            <p className="muted">{tr(p.excerpt)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
