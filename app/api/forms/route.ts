import { NextResponse } from "next/server";
import { FIREBASE_ON } from "@/lib/config";
import { createDocRest } from "@/lib/firestore-rest";
import { cleanForm, FORM_COLLECTION, type FormKind } from "@/lib/forms";

// Sadə IP əsaslı limit (hər server nüsxəsi üçün): 10 dəqiqədə 6 göndəriş.
const hits = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const MAX = 6;

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (list.length >= MAX) return NextResponse.json({ error: "rate" }, { status: 429 });

  let body: { kind?: string; data?: Record<string, unknown>; hp?: string; t?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const kind = body.kind as FormKind;
  if (!kind || !(kind in FORM_COLLECTION)) return NextResponse.json({ error: "kind" }, { status: 400 });
  // Honeypot doludursa və ya forma 2 saniyədən tez göndərilibsə: bot. Uğurlu kimi cavab ver, yazma.
  if (body.hp || (typeof body.t === "number" && now - body.t < 2000)) return NextResponse.json({ ok: true });

  let clean: Record<string, unknown>;
  try {
    clean = cleanForm(kind, body.data ?? {});
  } catch {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }
  if (!FIREBASE_ON) return NextResponse.json({ error: "no-firebase" }, { status: 503 });
  try {
    await createDocRest(FORM_COLLECTION[kind], clean);
  } catch (e) {
    console.error("[forms]", (e as Error).message);
    return NextResponse.json({ error: "store" }, { status: 502 });
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return NextResponse.json({ ok: true });
}
