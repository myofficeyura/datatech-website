import type { CommunityId, L, Lang, Scope } from "./types";

/** Lokallaşdırılmış mətn: EN boşdursa AZ göstərilir. */
export const tl = (v: L | undefined | null, lang: Lang): string => {
  if (!v) return "";
  return (lang === "en" ? v.en || v.az : v.az || v.en) || "";
};
export const hasL = (v: L | undefined | null) => Boolean(v && (v.az?.trim() || v.en?.trim()));

/** Dilə uyğun daxili link. href("en", "/events") → "/en/events". */
export const href = (lang: Lang, path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (lang === "az") return p;
  return p === "/" ? "/en" : `/en${p}`;
};

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toLocaleUpperCase("az"))
    .join("");

const MONTHS_AZ = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const monthName = (m: number, lang: Lang) => (lang === "az" ? MONTHS_AZ : MONTHS_EN)[m] ?? "";
export const WEEKDAYS = { az: ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"], en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] };

export const fmtDate = (iso: string, lang: Lang) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return lang === "az" ? `${d} ${monthName(m - 1, lang)} ${y}` : `${d} ${monthName(m - 1, lang)} ${y}`;
};

export const todayISO = () => {
  const d = new Date();
  // Bakı vaxtı (UTC+4)
  const t = new Date(d.getTime() + (4 * 60 + d.getTimezoneOffset()) * 60000);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

export const isPast = (iso: string) => iso < todayISO();

export const slugify = (s: string) =>
  s
    .toLocaleLowerCase("az")
    .replace(/ə/g, "e").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g").replace(/ş/g, "s").replace(/ç/g, "c")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Rəngə görə üzərindəki mətnin rəngi (ağ və ya tünd). */
export function onColor(hex: string) {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return lum > 0.36 ? "#0B132B" : "#ffffff";
}

export const isHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);

export const scopeMatches = (item: Scope, c: CommunityId) => item === c || item === "all";

export const whatsappOk = (u: string) => /^https?:\/\//.test(u);

export const mailto = (e: string) => (e.startsWith("mailto:") ? e : `mailto:${e}`);

/** Azərbaycan dilində yönlük hal şəkilçisi: DataTech-ə, DevOra-ya, ShellShock-a. */
export function azDative(name: string) {
  const low = name.toLocaleLowerCase("az");
  const vowels = "aıoueəiöü";
  const last = low[low.length - 1] ?? "";
  const lastVowel = [...low].reverse().find((ch) => vowels.includes(ch)) ?? "e";
  const back = "aıou".includes(lastVowel);
  return `${name}-${vowels.includes(last) ? (back ? "ya" : "yə") : back ? "a" : "ə"}`;
}
