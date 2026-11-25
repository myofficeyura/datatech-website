// QR generatoru üçün: Firebase Storage şəkillərini eyni domendən verir ki, canvas "tainted" olmasın.
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url") || "";
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (u.protocol !== "https:" || u.hostname !== "firebasestorage.googleapis.com") return new Response("forbidden", { status: 403 });
  const r = await fetch(u, { next: { revalidate: 86400 } });
  if (!r.ok) return new Response("not found", { status: 404 });
  const type = r.headers.get("content-type") || "";
  if (!type.startsWith("image/")) return new Response("forbidden", { status: 403 });
  return new Response(await r.arrayBuffer(), { headers: { "content-type": type, "cache-control": "public, max-age=86400" } });
}
