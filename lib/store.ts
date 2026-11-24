"use client";
// Firestore ilə işləmək üçün kiçik qat. Firebase qoşulmayanda eyni funksiyalar
// brauzerin localStorage-ında işləyir ki, sayt demo kimi tam klikləməli olsun.
import {
  addDoc, collection, doc, getDoc, getDocs, increment, limit as qlimit, orderBy, query, serverTimestamp, setDoc, updateDoc, where,
  type QueryConstraint,
} from "firebase/firestore";
import { fb } from "./firebase";

export type Rec = Record<string, unknown> & { id: string };

const LS = (col: string) => `dt-demo-${col}`;
function lsRead(col: string): Rec[] {
  try { return JSON.parse(localStorage.getItem(LS(col)) || "[]"); } catch { return []; }
}
function lsWrite(col: string, rows: Rec[]) {
  try { localStorage.setItem(LS(col), JSON.stringify(rows)); } catch {}
}

export async function addRecord(col: string, data: Record<string, unknown>): Promise<string> {
  const f = fb();
  if (f) {
    const ref = await addDoc(collection(f.db, col), { ...data, uid: f.auth.currentUser?.uid ?? null, createdAt: serverTimestamp() });
    return ref.id;
  }
  const id = Math.random().toString(36).slice(2, 10);
  lsWrite(col, [{ ...data, id, createdAt: new Date().toISOString() }, ...lsRead(col)]);
  return id;
}

export async function setRecord(col: string, id: string, data: Record<string, unknown>, merge = true) {
  const f = fb();
  if (f) return setDoc(doc(f.db, col, id), { ...data, updatedAt: serverTimestamp() }, { merge });
  const rows = lsRead(col).filter((r) => r.id !== id);
  const old = lsRead(col).find((r) => r.id === id) || {};
  lsWrite(col, [{ ...(merge ? old : {}), ...data, id, updatedAt: new Date().toISOString() }, ...rows]);
}

export async function getRecord(col: string, id: string): Promise<Rec | null> {
  const f = fb();
  if (f) {
    const s = await getDoc(doc(f.db, col, id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  }
  return lsRead(col).find((r) => r.id === id) ?? null;
}

export async function listRecords(col: string, opts: { order?: string; dir?: "asc" | "desc"; limit?: number; whereEq?: [string, unknown] } = {}): Promise<Rec[]> {
  const f = fb();
  if (f) {
    const cs: QueryConstraint[] = [];
    if (opts.whereEq) cs.push(where(opts.whereEq[0], "==", opts.whereEq[1]));
    if (opts.order) cs.push(orderBy(opts.order, opts.dir ?? "desc"));
    if (opts.limit) cs.push(qlimit(opts.limit));
    const s = await getDocs(query(collection(f.db, col), ...cs));
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  let rows = lsRead(col);
  if (opts.whereEq) rows = rows.filter((r) => r[opts.whereEq![0]] === opts.whereEq![1]);
  if (opts.order) {
    const k = opts.order, m = opts.dir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => (a[k] as number) > (b[k] as number) ? m : -m);
  }
  return opts.limit ? rows.slice(0, opts.limit) : rows;
}

export async function bump(col: string, id: string, field: string, by = 1) {
  const f = fb();
  if (f) return updateDoc(doc(f.db, col, id), { [field]: increment(by) });
  const r = await getRecord(col, id);
  if (r) await setRecord(col, id, { [field]: ((r[field] as number) || 0) + by });
}

/** Firestore Timestamp, ISO sətri və ya Date-i Date-ə çevirir. */
export function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v === "string") return new Date(v);
  if (v instanceof Date) return v;
  const t = v as { toDate?: () => Date };
  return t.toDate ? t.toDate() : null;
}
