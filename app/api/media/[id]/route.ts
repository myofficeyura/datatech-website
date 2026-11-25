import { FIREBASE_ON } from "@/lib/config";
import { getDocRest } from "@/lib/firestore-rest";

// Firebase Storage aktiv olmayanda yüklənən şəkillər Firestore-da (hub_media) saxlanır və buradan verilir.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!FIREBASE_ON || !/^[A-Za-z0-9_-]{6,64}$/.test(id)) return new Response("Not found", { status: 404 });
  const doc = await getDocRest<{ data: string; type: string }>("media", id, { revalidate: 86400 }).catch(() => null);
  if (!doc?.data) return new Response("Not found", { status: 404 });
  const bytes = Buffer.from(doc.data, "base64");
  const type = /^image\/(png|jpeg|webp|gif|svg\+xml|avif|x-icon|vnd\.microsoft\.icon)$/.test(doc.type) ? doc.type : "application/octet-stream";
  return new Response(bytes, {
    headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" },
  });
}
