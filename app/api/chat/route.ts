// Saytın AI köməkçisi. Yalnız saytdakı məlumatla cavab verir.
// Provayder: GEMINI_API_KEY varsa Google Gemini, yoxsa ANTHROPIC_API_KEY varsa Claude.
// Gündəlik limit: hər istifadəçiyə (cookie + IP) gündə DAILY_LIMIT sual.
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { createHmac } from "crypto";
import { COMPETITIONS, EVENTS, FAQ, MENTORS, POINTS, ROADMAP_90, ROADMAP_YEAR, SITE, STATS, TEAM, BADGES } from "@/lib/data";

const DAILY_LIMIT = Number(process.env.CHAT_DAILY_LIMIT || 20);
const MODEL = process.env.CHAT_MODEL || "claude-haiku-5-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

class BusyError extends Error {}

// Google Gemini (REST, SDK lazım deyil). Açar: https://aistudio.google.com/apikey
async function askGemini(messages: Anthropic.MessageParam[]): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content) }] })),
      generationConfig: { maxOutputTokens: 600, temperature: 0.4, ...(GEMINI_MODEL.includes("flash") ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
    }),
  });
  if (res.status === 429 || res.status === 503) throw new BusyError();
  const data = await res.json().catch(() => null);
  if (!res.ok) { console.error("gemini", res.status, JSON.stringify(data).slice(0, 300)); throw new Error("gemini " + res.status); }
  const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((x) => x.text || "").join("");
  return text || (data?.candidates?.[0]?.finishReason === "SAFETY" ? "Bu suala cavab verə bilmərəm." : "");
}

// Bilik bazası: lib/data.ts-dən avtomatik qurulur, sayt dəyişəndə çatbot da yenilənir.
const KNOWLEDGE = JSON.stringify({
  site: SITE, stats: STATS,
  team: TEAM.map((m) => ({ name: m.name, role: m.role.az, bio: m.bio.az })),
  events: EVENTS.map((e) => ({ title: e.title.az, date: e.date, time: e.time, place: e.place.az, past: !!e.past, desc: e.desc.az, url: `/tedbirler/${e.slug}` })),
  roadmap90: ROADMAP_90.map((r) => ({ date: r.date, title: r.title.az })),
  roadmapYear: ROADMAP_YEAR.map((r) => ({ date: r.date, title: r.title.az })),
  faq: FAQ.map((f) => ({ q: f.q.az, a: f.a.az })), points: POINTS, badges: BADGES.map((b) => `${b.name.az}: ${b.how.az}`),
  mentors: MENTORS.map((m) => ({ name: m.name, topics: m.topics.az, slots: m.slots })),
  competitions: COMPETITIONS.map((c) => c.title.az),
  pages: { join: "/qosul", events: "/tedbirler", cabinet: "/kabinet", leaderboard: "/reytinq", roadmap: "/yol-xeritesi", mentors: "/mentorlar", teamFinder: "/komanda-axtar", quiz: "/quiz", feedback: "/rey", contact: "/elaqe" },
});

const SYSTEM = `You are the assistant on the website of DataTech, the AI & Data Science student community at Baku Engineering University (BMU/BEU).
Answer questions about DataTech using only the site data below. You may also briefly explain basic data science and AI concepts to students.
If the answer is not in the data, say you don't know and point to the contact page (/elaqe). Never invent dates, people or numbers.
Reply in the user's language (Azerbaijani by default, English if they write in English). Keep answers short: 1-4 sentences, plain text, mention the relevant page path when useful.

SITE DATA:
${KNOWLEDGE}`;

const memory = new Map<string, number>(); // ən yaxşı cəhd: serverless instansı üzrə
const SECRET = process.env.CHAT_COOKIE_SECRET || "datatech-dev-secret";
const sign = (v: string) => createHmac("sha256", SECRET).update(v).digest("hex").slice(0, 16);

export async function POST(req: NextRequest) {
  const day = new Date().toISOString().slice(0, 10);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  const raw = req.cookies.get("dt_chat")?.value || "";
  const [cDay, cCount, cSig] = raw.split(".");
  let used = cDay === day && cSig === sign(`${cDay}.${cCount}`) ? Number(cCount) || 0 : 0;
  used = Math.max(used, memory.get(`${ip}:${day}`) || 0);

  if (used >= DAILY_LIMIT) {
    return NextResponse.json({ error: "Bugünkü sual limitin bitdi. Sabah yenidən yoxla.", left: 0 }, { status: 429 });
  }

  let body: { messages?: { role: string; content: string }[]; lang?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const messages: Anthropic.MessageParam[] = (body.messages || [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 1000) }));
  if (!messages.length || messages[0].role !== "user") return NextResponse.json({ error: "Bad request" }, { status: 400 });

  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: body.lang === "en" ? "The assistant isn't connected yet (missing API key). Meanwhile, see the FAQ page." : "Köməkçi hələ qoşulmayıb (API açarı əlavə edilməyib). Hələlik Suallar səhifəsinə bax.", left: DAILY_LIMIT - used });
  }

  try {
    let reply = "";
    if (process.env.GEMINI_API_KEY) reply = await askGemini(messages);
    else {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      output_config: { effort: "low" },
      cache_control: { type: "ephemeral" },
      system: SYSTEM,
      messages,
    });
    if (res.stop_reason === "refusal") reply = "Bu suala cavab verə bilmərəm.";
    else for (const b of res.content) if (b.type === "text") reply += b.text;
    }

    used += 1;
    memory.set(`${ip}:${day}`, used);
    const out = NextResponse.json({ reply: reply.trim() || "…", left: DAILY_LIMIT - used });
    out.cookies.set("dt_chat", `${day}.${used}.${sign(`${day}.${used}`)}`, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 60 * 26, path: "/" });
    return out;
  } catch (e) {
    if (e instanceof BusyError || e instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "Köməkçi hazırda məşğuldur, bir az sonra yoxla.", left: DAILY_LIMIT - used }, { status: 503 });
    if (e instanceof Anthropic.APIError) { console.error("chat api", e.status, e.message); return NextResponse.json({ error: "Köməkçi cavab vermədi.", left: DAILY_LIMIT - used }, { status: 502 }); }
    console.error("chat", e);
    return NextResponse.json({ error: "Köməkçi cavab vermədi.", left: DAILY_LIMIT - used }, { status: 500 });
  }
}
