import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/server-content";

// Admin dəyişiklikdən sonra çağırır ki, yeni açılan səhifələr dərhal təzə məzmunu görsün.
// Zərərsizdir (yalnız keşi təzələyir), amma tez-tez çağırışlar məhdudlaşdırılır.
let last = 0;
export async function POST() {
  const now = Date.now();
  if (now - last < 3000) return NextResponse.json({ ok: true, throttled: true });
  last = now;
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
