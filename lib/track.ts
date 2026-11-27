"use client";
// Saytda baş verən hər hadisəni `events` kolleksiyasına yazır (yalnız admin oxuyur).
// Anonim ziyarətçi id-si (vid) brauzerdə, sessiya id-si (sid) tabda saxlanır.
// Adminin öz baxışları sayılmır ki, statistika təmiz qalsın.
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { fb } from "./firebase";

export type TrackType =
  | "page_view" | "sign_in" | "sign_up" | "form_submit" | "event_register" | "event_unregister"
  | "rating" | "chat_question" | "qr_scan" | "click_out";

const ALLOWED = new Set(["path", "label", "target", "value", "text", "code"]);
let adminMode = false;
export const setTrackAdmin = (v: boolean) => { adminMode = v; };

function rid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function store(s: Storage | undefined, k: string) {
  try {
    if (!s) return rid();
    let v = s.getItem(k);
    if (!v) { v = rid(); s.setItem(k, v); }
    return v;
  } catch { return rid(); }
}

/** Bakı vaxtı ilə gün (YYYY-MM-DD) və saat (0-23). */
export function bakuParts(d = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value || "00";
  return { day: `${g("year")}-${g("month")}-${g("day")}`, hour: Number(g("hour")) };
}

function device() {
  const ua = navigator.userAgent;
  const dev = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|Android|iPhone/i.test(ua) ? "mobile" : "desktop";
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iOS/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Digər";
  const br = /Instagram/i.test(ua) ? "Instagram" : /TikTok|musical_ly|BytedanceWebview/i.test(ua) ? "TikTok" : /FBAN|FBAV/i.test(ua) ? "Facebook" : /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /SamsungBrowser/i.test(ua) ? "Samsung" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Digər";
  return { dev, os, br };
}

function source() {
  // İlk giriş mənbəyi sessiya boyu saxlanır: QR kodu, utm_source və ya referrer.
  try {
    const have = sessionStorage.getItem("dt-src");
    if (have) return have;
    const u = new URL(location.href);
    const qr = sessionStorage.getItem("dt-qr");
    let src = qr ? `qr:${qr}` : u.searchParams.get("utm_source") || "";
    if (!src && document.referrer) {
      const h = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (h && h !== location.hostname) src = h;
    }
    src = src || "birbaşa";
    sessionStorage.setItem("dt-src", src);
    return src;
  } catch { return "birbaşa"; }
}

export function track(type: TrackType, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || adminMode) return;
  const f = fb();
  if (!f) return; // demo rejimində yazmırıq
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!ALLOWED.has(k) || v == null) continue;
    clean[k] = typeof v === "number" ? v : String(v).slice(0, 300);
  }
  const { day, hour } = bakuParts();
  const { dev, os, br } = device();
  const doc = {
    type, path: clean.path ?? location.pathname, ...clean,
    vid: store(window.localStorage, "dt-vid"), sid: store(window.sessionStorage, "dt-sid"),
    uid: f.auth.currentUser?.uid ?? null, src: source(), dev, os, br,
    lang: document.documentElement.lang || "az", sw: Math.round(window.innerWidth),
    day, hour, createdAt: serverTimestamp(),
  };
  addDoc(collection(f.db, "events"), doc).catch(() => {});
}
