"use client";
import { getRecord, setRecord } from "./store";

/** /c/[code] səhifəsi üçün: check-in yazır. Nəticə: "ok" | "dup" | "closed" | "missing". */
export async function doCheckin(code: string, uid: string, email: string): Promise<"ok" | "dup" | "closed" | "missing"> {
  const s = await getRecord("sessions", code);
  if (!s) return "missing";
  if (!s.open) return "closed";
  const id = `${code}_${uid}`;
  try { if (await getRecord("checkins", id)) return "dup"; } catch {}
  await setRecord("checkins", id, { code, uid, email: email.toLowerCase(), kind: String(s.kind), day: String(s.day) }, false);
  return "ok";
}
