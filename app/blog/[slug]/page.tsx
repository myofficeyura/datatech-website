"use client";
import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { POSTS } from "@/lib/data";
import { fmtDate, useLang } from "@/lib/i18n";

export default function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { tr, lang, t } = useLang();
  const p = POSTS.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <article className="stack" style={{ gap: 20 }}>
      <Link href="/blog" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>← {t("blog")}</Link>
      <div className="page-h"><span className="note">{fmtDate(p.date, lang)} · {p.author}</span><h1>{tr(p.title)}</h1></div>
      <div className="prose">{tr(p.body).split("\n\n").map((para, i) => <p key={i}>{para}</p>)}</div>
    </article>
  );
}
