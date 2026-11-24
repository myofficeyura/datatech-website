"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { L } from "./data";

export type Lang = "az" | "en";

const DICT = {
  home: ["Ana səhifə", "Home"], home_s: ["Ana", "Home"], about: ["Haqqımızda", "About"], events: ["Tədbirlər", "Events"],
  roadmap: ["Yol xəritəsi", "Roadmap"], resources: ["Resurslar", "Resources"], rating: ["Reytinq", "Leaderboard"],
  cabinet: ["Kabinet", "Cabinet"], more: ["Daha çox", "More"], team: ["Komanda", "Team"], projects: ["Layihələr", "Projects"],
  competitions: ["Yarışlar", "Competitions"], teamfinder: ["Komanda axtar", "Team finder"], quiz: ["Həftəlik quiz", "Weekly quiz"],
  mentors: ["Mentorlar", "Mentors"], career: ["Karyera", "Careers"], news: ["AI xəbərləri", "AI news"], blog: ["Bloq", "Blog"],
  gallery: ["Qalereya", "Gallery"], stats: ["Statistika", "Stats"], partners: ["Tərəfdaşlar", "Partners"],
  certificate: ["Sertifikat yoxla", "Verify certificate"], badges: ["Nişanlar", "Badges"], faq: ["Suallar", "FAQ"], feedback: ["Rəy bildir", "Feedback"],
  contact: ["Əlaqə", "Contact"], join: ["Qoşul", "Join"], signin: ["Daxil ol", "Sign in"], signout: ["Çıxış", "Sign out"],
  register: ["Qeydiyyat", "Register"], registered: ["Qeydiyyatdasan ✓", "Registered ✓"], seeAll: ["Hamısı →", "See all →"],
  upcoming: ["Gələcək", "Upcoming"], past: ["Keçmiş", "Past"], seats: ["Boş yer", "Seats left"], send: ["Göndər", "Send"],
  sent: ["Göndərildi. Təşəkkürlər!", "Sent. Thank you!"], members: ["Üzv", "Members"], eventsN: ["Tədbir", "Events"],
  faculties: ["Fakültə", "Faculties"], nextEvent: ["Növbəti tədbir", "Next event"], points: ["Xal", "Points"],
  demo: ["Demo rejimi", "Demo mode"], admin: ["Admin", "Admin"], community: ["İcma", "Community"],
  required: ["Bu xananı doldur", "Please fill this in"], loading: ["Yüklənir…", "Loading…"],
} as const;
export type DictKey = keyof typeof DICT;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string; tr: (v: L | string) => string };
const LangCtx = createContext<Ctx>({ lang: "az", setLang: () => {}, t: (k) => DICT[k][0], tr: (v) => (typeof v === "string" ? v : v.az) });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("az");
  useEffect(() => {
    try { const s = localStorage.getItem("dt-lang"); if (s === "en" || s === "az") setLangState(s); } catch {}
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem("dt-lang", l); } catch {} };
  const t = (k: DictKey) => DICT[k][lang === "az" ? 0 : 1];
  const tr = (v: L | string) => (typeof v === "string" ? v : v[lang] || v.az);
  return <LangCtx.Provider value={{ lang, setLang, t, tr }}>{children}</LangCtx.Provider>;
}
export const useLang = () => useContext(LangCtx);

export function fmtDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  if (lang === "en") return d.toLocaleDateString("en-GB", opts);
  // Brauzerlərin az lokalı fərqli ola bilər, ona görə ay adlarını özümüz yazırıq.
  const M = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
  const parts: string[] = [];
  if (opts.day) parts.push(String(d.getDate()));
  if (opts.month) parts.push(opts.month === "short" ? M[d.getMonth()].slice(0, 3) : M[d.getMonth()]);
  if (opts.year) parts.push(String(d.getFullYear()));
  return parts.join(" ");
}
