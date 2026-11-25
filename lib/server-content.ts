import "server-only";
import { FIREBASE_ON } from "./config";
import { getDocRest, listDocsRest, queryEqRest } from "./firestore-rest";
import { buildContent } from "./normalize";
import { seedClone } from "./seed";
import type { Content } from "./types";

export const CONTENT_TAG = "content";
const o = { revalidate: 60, tags: [CONTENT_TAG] };

/**
 * Saytın bütün açıq məzmunu. Firebase qoşulmayıbsa və ya hələ "Defolt məzmun" yüklənməyibsə
 * (hub_site/main yoxdur) lib/seed.ts istifadə olunur. Səhifə açıq olanda Firestore-dakı
 * dəyişikliklər brauzerdə canlı (onSnapshot) yenilənir.
 */
export async function getContent(): Promise<{ content: Content; source: "seed" | "firestore" }> {
  if (!FIREBASE_ON) return { content: seedClone(), source: "seed" };
  try {
    const site = await getDocRest("site", "main", o);
    if (!site) return { content: seedClone(), source: "seed" };
    const [communities, events, team, mentors, partners, faqs, problems] = await Promise.all([
      listDocsRest<{ id: string }>("communities", o),
      listDocsRest<{ id: string }>("events", o),
      listDocsRest<{ id: string }>("team", o),
      listDocsRest<{ id: string }>("mentors", o),
      listDocsRest<{ id: string }>("partners", o),
      listDocsRest<{ id: string }>("faqs", o),
      queryEqRest<{ id: string }>("problems", "public", true, o),
    ]);
    return { content: buildContent({ site, communities, events, team, mentors, partners, faqs, problems }), source: "firestore" };
  } catch (e) {
    console.warn("[content] Firestore oxunmadı, defolt məzmun göstərilir:", (e as Error).message);
    return { content: seedClone(), source: "seed" };
  }
}
