// Müvəqqəti yoxlama: hər Gemini modelinə qısa sorğu göndərir, status və gecikməni göstərir.
// Açarı göstərmir. Problem həll olunanda silinəcək.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
let last = 0;
const MODELS = ["gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3.8-flash"];

export async function GET() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return NextResponse.json({ gemini_key: false, anthropic_key: Boolean(process.env.ANTHROPIC_API_KEY) });
  if (Date.now() - last < 60_000) return NextResponse.json({ error: "1 dəqiqə gözlə" }, { status: 429 });
  last = Date.now();
  const out = await Promise.all(MODELS.map(async (model) => {
    const t0 = Date.now();
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Say hi" }] }], generationConfig: { maxOutputTokens: 20 } }),
        signal: AbortSignal.timeout(20000),
      });
      const j = await r.json().catch(() => null);
      return { model, status: r.status, ms: Date.now() - t0, error: j?.error ? `${j.error.status}: ${String(j.error.message).slice(0, 160)}` : undefined };
    } catch (e) { return { model, status: 0, ms: Date.now() - t0, error: (e as Error).name }; }
  }));
  return NextResponse.json({ gemini_key: true, key_len: key.length, region: process.env.VERCEL_REGION || null, results: out });
}
