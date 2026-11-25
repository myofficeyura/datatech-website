// Firestore REST köməkçiləri (server tərəfi). Firebase SDK-sız, yüngül və keşlənə bilən.
import { col, firebaseConfig } from "./config";

type FsValue = {
  nullValue?: null; booleanValue?: boolean; integerValue?: string; doubleValue?: number; timestampValue?: string;
  stringValue?: string; arrayValue?: { values?: FsValue[] }; mapValue?: { fields?: Record<string, FsValue> };
};
export type FsDoc = { name: string; fields?: Record<string, FsValue> };

export function decodeValue(v: FsValue): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("timestampValue" in v) return Date.parse(v.timestampValue!);
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue?.values ?? []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue?.fields ?? {});
  return null;
}
export function decodeFields(fields: Record<string, FsValue>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) o[k] = decodeValue(v);
  return o;
}
export function decodeDoc<T>(d: FsDoc): T {
  const id = d.name.split("/").pop()!;
  return { ...(decodeFields(d.fields ?? {}) as object), id } as T;
}

export function encodeValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === "object") return { mapValue: { fields: encodeFields(v as Record<string, unknown>) } };
  return { stringValue: String(v) };
}
export function encodeFields(o: Record<string, unknown>) {
  const f: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) f[k] = encodeValue(v);
  return f;
}

const base = () => `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const key = () => `key=${encodeURIComponent(firebaseConfig.apiKey)}`;

export class FsError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

type FetchOpts = { revalidate?: number | false; tags?: string[] };
const nextOpts = (o?: FetchOpts) => (o ? { next: { revalidate: o.revalidate, tags: o.tags } } : { cache: "no-store" as const });

export async function getDocRest<T>(collection: string, id: string, o?: FetchOpts): Promise<T | null> {
  const r = await fetch(`${base()}/${col(collection)}/${encodeURIComponent(id)}?${key()}`, nextOpts(o));
  if (r.status === 404) return null;
  if (!r.ok) throw new FsError(r.status, `get ${collection}/${id}: ${r.status}`);
  return decodeDoc<T>((await r.json()) as FsDoc);
}

export async function listDocsRest<T>(collection: string, o?: FetchOpts): Promise<T[]> {
  const out: T[] = [];
  let token = "";
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${base()}/${col(collection)}?pageSize=300${token ? `&pageToken=${token}` : ""}&${key()}`, nextOpts(o));
    if (!r.ok) throw new FsError(r.status, `list ${collection}: ${r.status}`);
    const j = (await r.json()) as { documents?: FsDoc[]; nextPageToken?: string };
    for (const d of j.documents ?? []) out.push(decodeDoc<T>(d));
    if (!j.nextPageToken) break;
    token = encodeURIComponent(j.nextPageToken);
  }
  return out;
}

/** Sadə bərabərlik sorğusu (məs. public == true). */
export async function queryEqRest<T>(collection: string, field: string, value: unknown, o?: FetchOpts): Promise<T[]> {
  const body = {
    structuredQuery: {
      from: [{ collectionId: col(collection) }],
      where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: encodeValue(value) } },
      limit: 300,
    },
  };
  const r = await fetch(`${base()}:runQuery?${key()}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), ...nextOpts(o) });
  if (!r.ok) throw new FsError(r.status, `query ${collection}: ${r.status}`);
  const rows = (await r.json()) as { document?: FsDoc }[];
  return rows.filter((x) => x.document).map((x) => decodeDoc<T>(x.document!));
}

/** Anonim yaratma (formalar üçün). Firestore qaydaları sahələri və ölçüləri yoxlayır. */
export async function createDocRest(collection: string, data: Record<string, unknown>) {
  const r = await fetch(`${base()}/${col(collection)}?${key()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields: encodeFields(data) }),
    cache: "no-store",
  });
  if (!r.ok) throw new FsError(r.status, `create ${collection}: ${r.status} ${await r.text().catch(() => "")}`);
  return decodeDoc<{ id: string }>((await r.json()) as FsDoc).id;
}
