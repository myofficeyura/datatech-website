"use client";
// Brauzer tərəfi məlumat qatı. Firebase varsa Firestore/Storage, yoxdursa demo (localStorage).
import { col, FIREBASE_ON } from "./config";
import { DEMO_EVENT, demoDb, demoReset, demoWrite, seedToDb } from "./demo";
import { cleanForm, FORM_COLLECTION, type FormKind } from "./forms";
import { buildContent } from "./normalize";
import { seedClone } from "./seed";
import type { ColName, Content } from "./types";
import { getFb, getStorageMod } from "./firebase-client";

export const MODE: "firebase" | "demo" = FIREBASE_ON ? "firebase" : "demo";

type Row = Record<string, unknown> & { id: string };
const rowsOf = (m?: Record<string, Record<string, unknown>>): Row[] => Object.entries(m ?? {}).map(([id, v]) => ({ ...v, id }));

/** Saytın açıq məzmununa canlı abunə. cb(null) = Firestore boşdur, server məzmununu saxla. */
export function subscribeContent(cb: (c: Content | null) => void, onError?: (e: Error) => void): () => void {
  if (MODE === "demo") {
    const emit = () => {
      const raw = localStorage.getItem("hub-demo-db-v1");
      if (!raw) return cb(null);
      const db = demoDb();
      cb(buildContent({
        site: db.site?.main, communities: rowsOf(db.communities), events: rowsOf(db.events), team: rowsOf(db.team), mentors: rowsOf(db.mentors),
        partners: rowsOf(db.partners), faqs: rowsOf(db.faqs), problems: rowsOf(db.problems),
      }));
    };
    emit();
    const onStorage = (e: StorageEvent) => e.key === "hub-demo-db-v1" && emit();
    window.addEventListener(DEMO_EVENT, emit);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DEMO_EVENT, emit);
      window.removeEventListener("storage", onStorage);
    };
  }

  let stopped = false;
  const unsubs: (() => void)[] = [];
  (async () => {
    const { fs, db } = await getFb();
    if (stopped) return;
    const state: Record<string, unknown> = {};
    const keys = ["site", "communities", "events", "team", "mentors", "partners", "faqs", "problems"] as const;
    const emit = () => {
      if (!keys.every((k) => k in state)) return;
      if (!state.site) return cb(null);
      cb(buildContent(state as Parameters<typeof buildContent>[0]));
    };
    const err = (e: Error) => onError?.(e);
    unsubs.push(fs.onSnapshot(fs.doc(db, col("site"), "main"), (s) => { state.site = s.exists() ? s.data() : null; emit(); }, err));
    for (const k of ["communities", "events", "team", "mentors", "partners", "faqs"] as const) {
      unsubs.push(fs.onSnapshot(fs.collection(db, col(k)), (s) => { state[k] = s.docs.map((d) => ({ ...d.data(), id: d.id })); emit(); }, err));
    }
    const q = fs.query(fs.collection(db, col("problems")), fs.where("public", "==", true));
    unsubs.push(fs.onSnapshot(q, (s) => { state.problems = s.docs.map((d) => ({ ...d.data(), id: d.id })); emit(); }, err));
  })().catch((e) => onError?.(e as Error));
  return () => {
    stopped = true;
    unsubs.forEach((u) => u());
  };
}

/** Admin: bütün kolleksiyaya canlı abunə. */
export function subscribeCol<T extends { id: string }>(name: ColName, cb: (rows: T[]) => void, onError?: (e: Error) => void): () => void {
  if (MODE === "demo") {
    const emit = () => cb(rowsOf(demoDb()[name]) as T[]);
    emit();
    window.addEventListener(DEMO_EVENT, emit);
    return () => window.removeEventListener(DEMO_EVENT, emit);
  }
  let stop: (() => void) | null = null;
  let stopped = false;
  getFb().then(({ fs, db }) => {
    if (stopped) return;
    stop = fs.onSnapshot(fs.collection(db, col(name)), (s) => cb(s.docs.map((d) => ({ ...d.data(), id: d.id }) as T)), (e) => onError?.(e));
  }).catch((e) => onError?.(e));
  return () => {
    stopped = true;
    stop?.();
  };
}

const strip = (o: Record<string, unknown>) => {
  const { id: _id, ...rest } = o;
  return JSON.parse(JSON.stringify(rest)) as Record<string, unknown>;
};

export async function setDoc(name: ColName, id: string, data: Record<string, unknown>) {
  if (MODE === "demo") {
    const db = demoDb();
    db[name] = { ...(db[name] ?? {}), [id]: strip(data) };
    demoWrite(db);
    return;
  }
  const { fs, db } = await getFb();
  await fs.setDoc(fs.doc(db, col(name), id), { ...strip(data), updatedAt: Date.now() });
  pingRevalidate();
}

export async function updateDoc(name: ColName, id: string, patch: Record<string, unknown>) {
  if (MODE === "demo") {
    const db = demoDb();
    const cur = db[name]?.[id] ?? {};
    db[name] = { ...(db[name] ?? {}), [id]: { ...cur, ...strip(patch) } };
    demoWrite(db);
    return;
  }
  const { fs, db } = await getFb();
  await fs.updateDoc(fs.doc(db, col(name), id), { ...strip(patch), updatedAt: Date.now() });
  pingRevalidate();
}

export async function removeDoc(name: ColName, id: string) {
  if (MODE === "demo") {
    const db = demoDb();
    if (db[name]) delete db[name]![id];
    demoWrite(db);
    return;
  }
  const { fs, db } = await getFb();
  await fs.deleteDoc(fs.doc(db, col(name), id));
  pingRevalidate();
}

/** Defolt məzmunu (lib/seed.ts) yazır. Mövcud məzmunun üstünə yazılır. */
export async function loadDefaults() {
  if (MODE === "demo") {
    demoReset();
    return;
  }
  const { fs, db } = await getFb();
  const data = seedToDb(seedClone());
  const batch = fs.writeBatch(db);
  for (const name of ["site", "communities", "events", "team", "mentors", "partners", "faqs", "problems"] as const) {
    for (const [id, v] of Object.entries(data[name] ?? {})) batch.set(fs.doc(db, col(name), id), { ...strip(v), updatedAt: Date.now() });
  }
  await batch.commit();
  pingRevalidate();
}

let revalTimer: ReturnType<typeof setTimeout> | null = null;
function pingRevalidate() {
  if (revalTimer) clearTimeout(revalTimer);
  revalTimer = setTimeout(() => fetch("/api/revalidate", { method: "POST" }).catch(() => {}), 800);
}

// ───────── Şəkil yükləmə ─────────

/** Şəkli webp-ə çevirir və ölçüsünü kiçildir (loqolar üçün keepOriginal). */
export async function toWebp(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
  return blob && blob.size < file.size ? blob : file;
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });

export async function uploadImage(file: File, folder: string, opts: { logo?: boolean } = {}): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Yalnız şəkil faylı seç.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Şəkil 8 MB-dan böyük olmamalıdır.");
  const blob = opts.logo ? (file.size > 600 * 1024 ? await toWebp(file, 1024, 0.95) : file) : await toWebp(file, 1600, 0.82);

  if (MODE === "demo") {
    const small = blob.size > 400 * 1024 ? await toWebp(new File([blob], "x", { type: blob.type }), 900, 0.75) : blob;
    return blobToDataUrl(small);
  }

  const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "img").toLowerCase();
  const path = `hub/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  try {
    const { st, storage } = await getStorageMod();
    const r = st.ref(storage, path);
    await st.uploadBytes(r, blob, { contentType: blob.type, cacheControl: "public, max-age=31536000" });
    return await st.getDownloadURL(r);
  } catch (e) {
    // Firebase Storage aktiv deyilsə: şəkli Firestore-da saxla və /api/media/{id} ilə ver.
    console.warn("[upload] Storage alınmadı, Firestore-a yazılır:", (e as Error).message);
    let b = blob;
    if (b.size > 650 * 1024) b = await toWebp(new File([b], "x", { type: b.type }), 1200, 0.72);
    if (b.size > 700 * 1024) throw new Error("Şəkil çox böyükdür. Daha kiçik şəkil seç.");
    const dataUrl = await blobToDataUrl(b);
    const { fs, db } = await getFb();
    const ref = fs.doc(fs.collection(db, col("media")));
    await fs.setDoc(ref, { data: dataUrl.split(",")[1], type: b.type, size: b.size, folder, createdAt: Date.now() });
    return `/api/media/${ref.id}`;
  }
}

// ───────── Formalar ─────────

const LAST_KEY = "hub-form-last";
export async function submitForm(kind: FormKind, data: Record<string, unknown>, meta: { hp: string; startedAt: number }) {
  if (meta.hp) return; // bot: səssizcə qəbul edilmiş kimi göstər
  if (Date.now() - meta.startedAt < 2500) throw new Error("tooFast");
  try {
    const last = Number(localStorage.getItem(LAST_KEY) || 0);
    if (Date.now() - last < 30_000) throw new Error("tooFast");
  } catch (e) {
    if ((e as Error).message === "tooFast") throw e;
  }
  const clean = cleanForm(kind, data);
  if (MODE === "demo") {
    const db = demoDb();
    const name = FORM_COLLECTION[kind];
    const id = Math.random().toString(36).slice(2, 12);
    db[name] = { ...(db[name] ?? {}), [id]: clean };
    demoWrite(db);
  } else {
    const r = await fetch("/api/forms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, data, hp: meta.hp, t: meta.startedAt }) });
    if (r.status === 429) throw new Error("tooFast");
    if (!r.ok) throw new Error("formError");
  }
  try {
    localStorage.setItem(LAST_KEY, String(Date.now()));
  } catch {}
}

export { seedToDb };
