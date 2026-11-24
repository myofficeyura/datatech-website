// AI xəbər lenti: bir neçə açıq RSS mənbəyini serverdə oxuyur, 3 saatlıq keşlə.
import { NextResponse } from "next/server";

export const revalidate = 10800;

const FEEDS = [
  { name: "MIT Technology Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
  { name: "Google AI", url: "https://blog.google/technology/ai/rss/" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
];

type Item = { title: string; link: string; date: string; source: string };

const decode = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#039;|&apos;/g, "'").trim();
const pick = (block: string, tag: string) => { const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i")); return m ? decode(m[1]) : ""; };

function parse(xml: string, source: string): Item[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0, 8).map((b) => {
    let link = pick(b, "link");
    if (!link) { const m = b.match(/<link[^>]*href="([^"]+)"/i); link = m ? m[1] : ""; }
    const date = pick(b, "pubDate") || pick(b, "updated") || pick(b, "published");
    return { title: pick(b, "title"), link, date: date ? new Date(date).toISOString() : "", source };
  }).filter((i) => i.title && i.link.startsWith("http"));
}

export async function GET() {
  const results = await Promise.allSettled(FEEDS.map(async (f) => {
    const r = await fetch(f.url, { next: { revalidate }, headers: { "user-agent": "DataTech-NewsFeed/1.0" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(String(r.status));
    return parse(await r.text(), f.name);
  }));
  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  return NextResponse.json({ items, updated: new Date().toISOString() });
}
