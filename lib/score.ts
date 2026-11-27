// DataTech aktivlik və performans alqoritmi.
// Hər üzv üçün aylıq bal (0-100) 8 kanaldan yığılır. Hər kanalın aylıq "tam bal" hədəfi var:
// kanal balı = min(1, xam xal / hədəf) × çəki. Üstəlik: hər həftə aktiv olana ×1.1, GitHub/Kaggle +5-ə qədər bonus.
// Ay bitəndə nəticə `scores/{YYYY-MM}` arxivinə yazılır və heç vaxt silinmir; xam data da qalır.

export type Channel = "events" | "lessons" | "contrib" | "whatsapp" | "web" | "social" | "linkedin" | "referral";

export const CHANNELS: { id: Channel; az: string; weight: number; target: number; how: string }[] = [
  { id: "events",   az: "Tədbir iştirakı",      weight: 20, target: 30, how: "Check-in 10, vaxtında gəlmək +2, qeydiyyat 2" },
  { id: "lessons",  az: "Dərslərdə davamlılıq", weight: 20, target: 40, how: "Dərsə gəlmək 10, tapşırıq 5" },
  { id: "contrib",  az: "Töhfə",                weight: 15, target: 40, how: "Layihə 30, yarış 15, könüllülük 15, quiz düz cavab 2, rəy/form 3" },
  { id: "whatsapp", az: "WhatsApp söhbət qrupu", weight: 10, target: 60, how: "Mənalı mesaj 1, qısa mesaj 0.3; gündə maks. 10 xal" },
  { id: "web",      az: "Sayt",                 weight: 10, target: 30, how: "Aktiv gün 2, çatbot sualı 0.5, səhifə baxışı 0.2 (gündə maks. 4)" },
  { id: "social",   az: "Instagram və TikTok",  weight: 10, target: 20, how: "Şərh 2, paylaşma 3, DataTech-i tag/mention 5" },
  { id: "linkedin", az: "LinkedIn",             weight: 5,  target: 16, how: "Şərh 2, repost 4, DataTech-i qeyd edən post 8" },
  { id: "referral", az: "Dəvət",                weight: 10, target: 20, how: "Gətirdiyi və həmin ay aktiv olan hər üzv 10" },
];
export const STREAK_MULT = 1.1;   // ayın hər həftəsi aktiv olana
export const BONUS_MAX = 5;       // GitHub / Kaggle

// Xam siqnal: bir üzvün bir gündə bir kanalda etdiyi hərəkət(lər).
// `member` = üzvün açarı (BMU e-poçtu, kiçik hərflə). `kind` hərəkətin növüdür, `n` sayı.
export type Signal = { member: string; day: string; channel: Channel | "bonus"; kind: string; n: number; source: string };

// Hər hərəkət növünün xalı.
export const KIND_POINTS: Record<string, number> = {
  checkin: 10, ontime: 2, register: 2,
  lesson: 10, homework: 5,
  project: 30, contest: 15, volunteer: 15, quiz_correct: 2, feedback: 3, form: 3,
  wa_msg: 1, wa_short: 0.3,
  web_day: 2, chat: 0.5, page_view: 0.2,
  comment: 2, share: 3, mention: 5, tag: 5,
  li_comment: 2, li_repost: 4, li_post: 8,
  referral_active: 10,
  github: 1, kaggle: 1,
};
const DAILY_CAP: Partial<Record<Channel, number>> = { whatsapp: 10, web: 4 + 2 + 3 };

export type MemberScore = {
  member: string; name: string; total: number; base: number; streak: boolean; bonus: number;
  channels: Record<Channel, { raw: number; pts: number }>; activeWeeks: number; activeDays: number;
};

/** Ayın həftələri (1-7, 8-14, 15-21, 22-28, 29+). Son "həftə" 3 gündən qısadırsa əvvəlkinə qatılır. */
function weekOf(day: string, daysInMonth: number) {
  const d = Number(day.slice(8, 10));
  const w = Math.min(Math.floor((d - 1) / 7), daysInMonth - 28 < 3 ? 3 : 4);
  return w;
}

export function computeMonth(month: string, signals: Signal[], names: Map<string, string>): MemberScore[] {
  const [y, m] = month.split("-").map(Number);
  const dim = new Date(y, m, 0).getDate();
  const weeksInMonth = dim - 28 < 3 ? 4 : 5;
  const inMonth = signals.filter((s) => s.day.startsWith(month));
  const by = new Map<string, Signal[]>();
  for (const s of inMonth) { const k = s.member.toLowerCase(); (by.get(k) || by.set(k, []).get(k)!).push(s); }

  const out: MemberScore[] = [];
  for (const [member, list] of by) {
    // gündəlik limitlər
    const perDay = new Map<string, number>();
    const channels = Object.fromEntries(CHANNELS.map((c) => [c.id, { raw: 0, pts: 0 }])) as MemberScore["channels"];
    let bonusRaw = 0;
    const days = new Set<string>(), weeks = new Set<number>();
    for (const s of list) {
      const p = (KIND_POINTS[s.kind] ?? 1) * s.n;
      if (p <= 0) continue;
      days.add(s.day); weeks.add(weekOf(s.day, dim));
      if (s.channel === "bonus") { bonusRaw += p; continue; }
      const cap = DAILY_CAP[s.channel];
      if (cap != null) {
        const key = s.channel + s.day; const used = perDay.get(key) || 0;
        const add = Math.max(0, Math.min(p, cap - used)); perDay.set(key, used + add);
        channels[s.channel].raw += add;
      } else channels[s.channel].raw += p;
    }
    let base = 0;
    for (const c of CHANNELS) {
      const pts = Math.min(1, channels[c.id].raw / c.target) * c.weight;
      channels[c.id].pts = Math.round(pts * 10) / 10; base += pts;
    }
    const streak = weeks.size >= weeksInMonth;
    const bonus = Math.min(BONUS_MAX, bonusRaw);
    const total = Math.min(100, base * (streak ? STREAK_MULT : 1) + bonus);
    out.push({ member, name: names.get(member) || member, total: Math.round(total * 10) / 10, base: Math.round(base * 10) / 10,
      streak, bonus: Math.round(bonus * 10) / 10, channels, activeWeeks: weeks.size, activeDays: days.size });
  }
  return out.sort((a, b) => b.total - a.total || b.activeDays - a.activeDays || a.name.localeCompare(b.name));
}

/* ------------------------- import parserləri ------------------------- */

export const normPhone = (s: string) => {
  const d = (s || "").replace(/\D/g, "");
  if (d.startsWith("994")) return d.slice(-9);
  if (d.startsWith("0")) return d.slice(1).slice(-9);
  return d.slice(-9);
};
export const normName = (s: string) => (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9əıöüğşç ]/g, "").replace(/\s+/g, " ").trim();
export const normUser = (s: string) => (s || "").trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?[^/]+\//, "").replace(/\/.*$/, "").toLowerCase();

export type RosterRow = { email: string; name: string; phone: string; waName: string; faculty: string; year: string; instagram: string; tiktok: string; linkedin: string; github: string; kaggle: string; joined: string };

/** CSV oxuyucu (dırnaqlı sahələr, vergül və ya nöqtəli vergül). */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, "");
  const sep = (t.split("\n")[0].match(/;/g) || []).length > (t.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true; else if (c === sep) { row.push(cell); cell = ""; } else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

/** Google Form cavab cədvəlini (CSV) üzv siyahısına çevirir. Sütunları başlığa görə tapır. */
export function parseRoster(csv: string): RosterRow[] {
  const [head, ...rows] = parseCsv(csv);
  const find = (...keys: string[]) => head.findIndex((h) => keys.some((k) => h.toLowerCase().includes(k)));
  const ix = {
    ts: find("timestamp", "vaxt", "zaman"), name: find("ad və soyad", "ad ve soyad", "name"), email: find("bmu e-poçt", "e-poçt", "email"),
    phone: find("whatsapp nömrə"), waName: find("whatsapp-da ad"), faculty: find("fakültə"), year: find("kurs"),
    ig: find("instagram"), tt: find("tiktok"), li: find("linkedin"), gh: find("github"), kg: find("kaggle"),
  };
  const g = (r: string[], i: number) => (i >= 0 ? (r[i] || "").trim() : "");
  const byEmail = new Map<string, RosterRow>();
  for (const r of rows) {
    const email = g(r, ix.email).toLowerCase(); if (!email.includes("@")) continue;
    const u = (v: string) => (v.toLowerCase() === "yox" ? "" : normUser(v));
    byEmail.set(email, { // eyni adam iki dəfə doldurubsa, sonuncu qalır
      email, name: g(r, ix.name), phone: normPhone(g(r, ix.phone)), waName: g(r, ix.waName), faculty: g(r, ix.faculty), year: g(r, ix.year),
      instagram: u(g(r, ix.ig)), tiktok: u(g(r, ix.tt)), linkedin: g(r, ix.li).toLowerCase().replace(/^.*linkedin\.com\/in\//, "").replace(/\/.*$/, ""),
      github: u(g(r, ix.gh)), kaggle: u(g(r, ix.kg)), joined: g(r, ix.ts),
    });
  }
  return [...byEmail.values()];
}

/** Tanınmayan göndərən üçün əl ilə bağlama açarı (aliases kolleksiyası). */
export const aliasKey = (s: string) => { const p = normPhone(s); return p.length === 9 && /\d{6}/.test(s) ? "p" + p : "n" + normName(s).replace(/ /g, "_"); };

/** Eyni açarlı siqnalları birləşdirir. Bir import daxilində toplanır; importlar arasında maksimum götürülür ki,
 *  eyni söhbəti (və ya cədvəli) yenidən yükləmək xalı ikiqat artırmasın. */
export function mergeImports(batches: Signal[][]): Signal[] {
  const best = new Map<string, Signal>();
  for (const b of batches) {
    const sum = new Map<string, Signal>();
    for (const s of b) { const k = `${s.member}|${s.day}|${s.channel}|${s.kind}|${s.source}`; const o = sum.get(k); if (o) o.n += s.n; else sum.set(k, { ...s }); }
    for (const [k, s] of sum) { const o = best.get(k); if (!o || s.n > o.n) best.set(k, s); }
  }
  return [...best.values()];
}

/** Üzvü telefon, WhatsApp adı, ad, sosial istifadəçi adı və ya e-poçt ilə tapır. */
export function makeMatcher(roster: RosterRow[], aliases: Map<string, string> = new Map()) {
  const phone = new Map<string, string>(), name = new Map<string, string>(), user = new Map<string, string>(), email = new Map<string, string>();
  for (const r of roster) {
    email.set(r.email, r.email);
    if (r.phone) phone.set(r.phone, r.email);
    for (const n of [r.waName, r.name]) if (n) name.set(normName(n), r.email);
    for (const [p, u] of [["ig", r.instagram], ["tt", r.tiktok], ["li", r.linkedin], ["gh", r.github], ["kg", r.kaggle]]) if (u) user.set(`${p}:${u}`, r.email);
  }
  return {
    byWhatsapp(sender: string) {
      const a = aliases.get(aliasKey(sender)); if (a) return a;
      const p = normPhone(sender); if (p.length === 9 && phone.has(p)) return phone.get(p)!;
      return name.get(normName(sender)) || null;
    },
    byUser(platform: "ig" | "tt" | "li" | "gh" | "kg", u: string) { return user.get(`${platform}:${normUser(u)}`) || null; },
    byAny(v: string) {
      const a = aliases.get(aliasKey(v)); if (a) return a;
      const s = v.trim().toLowerCase();
      if (email.has(s)) return s;
      const p = normPhone(s); if (p.length === 9 && phone.has(p)) return phone.get(p)!;
      return name.get(normName(s)) || null;
    },
  };
}

/** WhatsApp "Söhbəti ixrac et" (.txt) faylını oxuyur. Android və iPhone formatlarını tanıyır. */
export function parseWhatsapp(text: string): { day: string; sender: string; body: string }[] {
  const out: { day: string; sender: string; body: string }[] = [];
  const re = /^‎?\[?(\d{1,2})[./-](\d{1,2})[./-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*(?:[AP]M)?\]?\s*(?:-\s*)?([^:]{1,80}?):\s(.*)$/i;
  let last: { day: string; sender: string; body: string } | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/[‎ ]/g, " ").trim();
    const m = line.match(re);
    if (m) {
      let [, d, mo, y] = m; if (y.length === 2) y = "20" + y;
      // ay/gün sırası: gün 12-dən böyükdürsə aydındır, yoxsa D.M (Azərbaycan formatı) qəbul edilir
      if (Number(mo) > 12) [d, mo] = [mo, d];
      last = { day: `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`, sender: m[6].trim(), body: m[7] };
      out.push(last);
    } else if (last && line) last.body += "\n" + line; // çoxsətirli mesaj
  }
  return out;
}

const SYSTEM_MSG = /(media omitted|şəkil buraxıldı|<media|image omitted|video omitted|sticker omitted|bu mesaj silindi|this message was deleted|deleted this message|joined using|qoşuldu|left$|tərk etdi|added|removed|changed|əlavə etdi|çıxartdı)/i;
/** WhatsApp mesajlarını siqnallara çevirir: mənalı (3+ söz) = wa_msg, qısa = wa_short; media/sistem mesajları sayılmır. */
export function whatsappSignals(msgs: ReturnType<typeof parseWhatsapp>, match: ReturnType<typeof makeMatcher>) {
  const agg = new Map<string, Signal>(); const unknown = new Map<string, number>();
  for (const m of msgs) {
    if (SYSTEM_MSG.test(m.body)) continue;
    const who = match.byWhatsapp(m.sender);
    if (!who) { unknown.set(m.sender, (unknown.get(m.sender) || 0) + 1); continue; }
    const kind = m.body.trim().split(/\s+/).length >= 3 ? "wa_msg" : "wa_short";
    const k = `${who}|${m.day}|${kind}`;
    const s = agg.get(k) || { member: who, day: m.day, channel: "whatsapp" as Channel, kind, n: 0, source: "whatsapp" };
    s.n++; agg.set(k, s);
  }
  return { signals: [...agg.values()], unknown: [...unknown.entries()].sort((a, b) => b[1] - a[1]) };
}

/**
 * Sosial media / iştirak / töhfə cədvəli (CSV). Sütunlar: tarix, platforma, kim, hərəkət, say(istəyə bağlı).
 * platforma: instagram | tiktok | linkedin | github | kaggle | tədbir | dərs | töhfə
 * kim: istifadəçi adı (sosial) və ya e-poçt / telefon / ad (digər)
 * hərəkət: comment, share, mention, tag, repost, post, checkin, ontime, lesson, homework, project, contest, volunteer, feedback
 */
export function manualSignals(csv: string, match: ReturnType<typeof makeMatcher>) {
  const [head, ...rows] = parseCsv(csv);
  const h = head.map((x) => x.toLowerCase().trim());
  const col = (...k: string[]) => h.findIndex((x) => k.some((y) => x.includes(y)));
  const iD = col("tarix", "date"), iP = col("platform"), iW = col("kim", "who", "user"), iA = col("hərəkət", "action"), iN = col("say", "count");
  const out: Signal[] = []; const unknown: string[] = [];
  const P: Record<string, ["ig" | "tt" | "li" | "gh" | "kg" | null, Channel | "bonus"]> = {
    instagram: ["ig", "social"], tiktok: ["tt", "social"], linkedin: ["li", "linkedin"], github: ["gh", "bonus"], kaggle: ["kg", "bonus"],
    "tədbir": [null, "events"], tedbir: [null, "events"], "dərs": [null, "lessons"], ders: [null, "lessons"], "töhfə": [null, "contrib"], tohfe: [null, "contrib"],
  };
  for (const r of rows) {
    const plat = (r[iP] || "").trim().toLowerCase(); const map = P[plat]; if (!map) continue;
    const who = map[0] ? match.byUser(map[0], r[iW] || "") || match.byAny(r[iW] || "") : match.byAny(r[iW] || "");
    if (!who) { unknown.push(`${plat}: ${r[iW]}`); continue; }
    let kind = (r[iA] || "").trim().toLowerCase();
    if (map[1] === "linkedin") kind = { comment: "li_comment", repost: "li_repost", share: "li_repost", post: "li_post", mention: "li_post" }[kind] || kind;
    if (map[1] === "bonus") kind = plat;
    const d = (r[iD] || "").trim(); const day = /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : d.replace(/^(\d{1,2})[./](\d{1,2})[./](\d{4}).*$/, (_, a, b, c) => `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    out.push({ member: who, day, channel: map[1], kind, n: Number(r[iN]) || 1, source: plat });
  }
  return { signals: out, unknown };
}
