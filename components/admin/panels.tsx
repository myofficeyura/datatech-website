"use client";
import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Img, LogoMark, Modal, toast } from "@/components/ui/bits";
import { canEdit, type Me } from "@/lib/admin-auth";
import { loadDefaults, MODE, removeDoc, setDoc, subscribeCol, updateDoc, uploadImage } from "@/lib/db";
import { catLabel } from "@/lib/i18n";
import { drawQr } from "@/lib/qr";
import { SEED_COMMUNITIES, SEED_SITE } from "@/lib/seed";
import { COMMUNITY_IDS, type AdminRole, type ColName, type Community, type CommunityId, type LogoSet, type SiteSettings } from "@/lib/types";
import { cx, initials, isHex, onColor, slugify, uid } from "@/lib/utils";
import { ImageInput, SchemaForm, Switch, type FieldDef } from "./fields";

type Row = Record<string, unknown> & { id: string };
export type AdminData = {
  seeded: boolean; loaded: boolean; error: string;
  site: SiteSettings; communities: Record<CommunityId, Community>;
  events: Row[]; team: Row[]; mentors: Row[]; partners: Row[]; faqs: Row[];
  problems: Row[]; questions: Row[]; collabs: Row[]; registrations: Row[];
};
type Target = "site" | CommunityId;
const NAMES: Record<CommunityId, string> = { devora: "DevOra", shellshock: "ShellShock", datatech: "DataTech", innotech: "InnoTech" };
const L = (v: unknown) => (v && typeof v === "object" ? ((v as { az?: string }).az || (v as { en?: string }).en || "") : String(v ?? ""));
const fmtTime = (n: unknown) => (typeof n === "number" && n ? new Date(n).toLocaleString("az") : "");

function PanelHead({ title, lead, right }: { title: string; lead?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl text-sm text-muted">{lead}</p>}
      </div>
      {right}
    </div>
  );
}

function Box({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("card p-5 md:p-6", className)}>{children}</div>;
}

function NeedSeed({ data, me }: { data: AdminData; me: Me }) {
  if (data.seeded || !data.loaded) return null;
  return (
    <Box className="mb-6 border-amber-400/40">
      <p className="font-semibold">Firestore-da hələ məzmun yoxdur.</p>
      <p className="mt-1 text-sm text-muted">Sayt hazırda defolt məzmunu (lib/seed.ts) göstərir. Redaktə etmək üçün əvvəlcə onu Firestore-a yüklə.</p>
      {me.role === "super" && <SeedButton className="mt-4" />}
    </Box>
  );
}

function SeedButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button className={cx("btn btn-primary btn-sm", className)} disabled={busy} onClick={async () => {
      if (!confirm("Defolt məzmun yüklənsin? Mövcud ortaq sayt, icma, tədbir, komanda, mentor, FAQ və təsdiqlənmiş problem sənədlərinin üstünə yazılacaq (gələn müraciətlər toxunulmur).")) return;
      setBusy(true);
      try { await loadDefaults(); toast("Defolt məzmun yükləndi"); } catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
    }}>
      <Icon name="refresh" size={14} /> {busy ? "Yüklənir…" : "Defolt məzmunu yüklə"}
    </button>
  );
}

function TargetPicker({ me, value, onChange, withSite = true, data }: { me: Me; value: Target; onChange: (t: Target) => void; withSite?: boolean; data: AdminData }) {
  const opts: Target[] = [...(withSite && me.role === "super" ? (["site"] as Target[]) : []), ...COMMUNITY_IDS.filter((c) => canEdit(me, c))];
  return (
    <div className="mb-6 flex flex-wrap gap-2" role="tablist">
      {opts.map((t) => (
        <button key={t} role="tab" aria-selected={value === t} className="chip" onClick={() => onChange(t)}>
          {t === "site" ? <Icon name="globe" size={14} /> : <span className="dot" style={{ background: data.communities[t].accent }} />}
          {t === "site" ? "Ortaq sayt" : NAMES[t]}
        </button>
      ))}
    </div>
  );
}

function useTarget(me: Me): [Target, (t: Target) => void] {
  return useState<Target>(me.role === "super" ? "site" : me.community!);
}

async function saveTarget(data: AdminData, t: Target, patch: Record<string, unknown>) {
  if (t === "site") await setDoc("site", "main", { ...data.site, ...patch });
  else await setDoc("communities", t, { ...data.communities[t], ...patch });
}

// ─────────────────────────── İcmal ───────────────────────────
export function DashboardPanel({ me, data, go }: { me: Me; data: AdminData; go: (k: string) => void }) {
  const pending = data.problems.filter((p) => p.status === "pending").length;
  const q = data.questions.filter((x) => !x.answered).length;
  const c = data.collabs.filter((x) => !x.answered).length;
  const cards = [
    { label: "Gözləyən problemlər", value: pending, icon: "inbox", to: "problems" },
    { label: "Cavabsız suallar", value: q, icon: "question", to: "inbox" },
    { label: "Əməkdaşlıq müraciətləri", value: c, icon: "handshake", to: "inbox" },
    { label: "Tədbir qeydiyyatları", value: data.registrations.length, icon: "users", to: "events" },
  ];
  return (
    <>
      <PanelHead title={`Salam, ${me.name.split(" ")[0]}`} lead={me.role === "super" ? "Baş admin: bütün icmaları və ortaq saytı idarə edirsən." : `${NAMES[me.community!]} admini: yalnız öz icmanın məzmununu redaktə edə bilərsən.`} />
      <NeedSeed data={data} me={me} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((k) => (
          <button key={k.label} onClick={() => go(k.to)} className="card card-hover p-5 text-left">
            <Icon name={k.icon} size={20} className="text-accent-text" />
            <p className="mt-4 font-display text-4xl font-semibold">{k.value}</p>
            <p className="mt-1 text-sm text-muted">{k.label}</p>
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Box>
          <h2 className="font-display text-lg font-semibold">Rejim</h2>
          <p className="mt-2 text-sm text-muted">{MODE === "firebase" ? "Firebase qoşulub. Dəyişikliklər dərhal hamı üçün saytda görünür." : "Demo rejimi (Firebase yoxdur). Dəyişikliklər yalnız bu brauzerdə görünür."}</p>
          {me.role === "super" && (
            <>
              <p className="mt-4 text-sm text-muted">Defolt məzmun: lib/seed.ts faylındakı ilk məlumatlar (icmalar, tədbir, komandalar, FAQ).</p>
              <SeedButton className="mt-3" />
            </>
          )}
        </Box>
        <Box>
          <h2 className="font-display text-lg font-semibold">Tez keçidlər</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[["brand", "Loqo dəyiş"], ["brand", "Rəng dəyiş"], ["events", "Yeni tədbir"], ["team", "Komanda"], ["qr", "QR yarat"], ["texts", "Mətnlər"]].map(([k, l], i) => (
              <button key={i} className="btn btn-ghost btn-sm justify-start" onClick={() => go(k!)}>{l}</button>
            ))}
          </div>
        </Box>
      </div>
    </>
  );
}

// ─────────────────────────── Loqo və rəng ───────────────────────────
export function BrandPanel({ me, data }: { me: Me; data: AdminData }) {
  const [t, setT] = useTarget(me);
  const obj = t === "site" ? data.site : data.communities[t];
  const name = t === "site" ? "Ortaq sayt" : NAMES[t];
  const def = t === "site" ? SEED_SITE.accent : SEED_COMMUNITIES[t].accent;
  const [color, setColor] = useState(obj.accent);
  useEffect(() => setColor(obj.accent), [obj.accent, t]);
  const [busy, setBusy] = useState(false);
  const disabled = !data.seeded;

  const setLogo = async (variant: "dark" | "light", url: string) => {
    const old = obj.logo[variant];
    const rest = obj.logo.history.filter((h) => h.url !== old && h.url !== url);
    const history = (old && old !== url ? [{ url: old, at: Date.now(), variant }, ...rest] : rest).slice(0, 12);
    const logo: LogoSet = { ...obj.logo, [variant]: url, history };
    try { await saveTarget(data, t, { logo }); toast("Loqo yeniləndi"); } catch (e) { toast((e as Error).message, "err"); }
  };
  const upload = async (variant: "dark" | "light", file?: File) => {
    if (!file) return;
    setBusy(true);
    try { await setLogo(variant, await uploadImage(file, `logos/${t}`, { logo: true })); } catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
  };
  const preview = { name: t === "site" ? data.site.name.az : NAMES[t], logo: obj.logo, accent: color };

  return (
    <>
      <PanelHead title="Loqo və rəng" lead="Loqonu yüklə, önbaxışda yoxla və rəngi seç. Dəyişiklik dərhal saytda görünür, yenidən deploy lazım deyil." />
      <NeedSeed data={data} me={me} />
      <TargetPicker me={me} value={t} onChange={setT} data={data} />

      <Box>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">{name}: loqo</h2>
          <label className="flex items-center gap-3 text-sm">
            Ağ kartda göstər (ağ fonlu loqolar üçün)
            <Switch on={obj.logo.card} onChange={(v) => saveTarget(data, t, { logo: { ...obj.logo, card: v } }).then(() => toast("Saxlanıldı"))} disabled={disabled} label="Ağ kart" />
          </label>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {(["dark", "light"] as const).map((v) => (
            <div key={v} className="rounded-2xl border border-line2 p-4">
              <p className="label">{v === "dark" ? "Qaranlıq fon üçün" : "İşıqlı fon üçün"}</p>
              <div className={cx("mt-3 grid h-40 place-items-center rounded-xl", v === "dark" ? "bg-[#0B132B]" : "bg-[#F5F7FC]")} data-testid={`logo-preview-${v}`}>
                <LogoMark c={preview} size={104} rounded={20} theme={v} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className={cx("btn btn-ghost btn-sm cursor-pointer", (disabled || busy) && "pointer-events-none opacity-50")}>
                  <Icon name="upload" size={14} /> Yüklə
                  <input type="file" accept="image/*" className="hidden" data-testid={`logo-upload-${v}`} onChange={(e) => upload(v, e.target.files?.[0])} />
                </label>
                {obj.logo[v] && <button className="btn btn-ghost btn-sm" disabled={disabled} onClick={() => setLogo(v, "")}><Icon name="trash" size={14} /> Sil (baş hərflər)</button>}
                {v === "light" && obj.logo.dark && obj.logo.light !== obj.logo.dark && <button className="btn btn-ghost btn-sm" disabled={disabled} onClick={() => setLogo("light", obj.logo.dark)}>Qaranlıqdakını götür</button>}
              </div>
            </div>
          ))}
        </div>
        {obj.logo.history.length > 0 && (
          <div className="mt-6">
            <p className="label mb-3">Köhnə versiyalar</p>
            <ul className="flex flex-wrap gap-3">
              {obj.logo.history.map((h, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl border border-line2 p-2 pr-3">
                  <span className={cx("relative h-12 w-12 overflow-hidden rounded-xl", h.variant === "dark" ? "bg-[#0B132B]" : "bg-white")}><Img src={h.url} alt="" fill sizes="96px" className="object-contain p-1" /></span>
                  <span className="text-xs text-faint">{h.variant === "dark" ? "Qaranlıq" : "İşıqlı"}<br />{new Date(h.at).toLocaleDateString("az")}</span>
                  <button className="btn btn-ghost btn-sm" disabled={disabled} onClick={() => setLogo(h.variant, h.url)}><Icon name="undo" size={14} /> Qaytar</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {t === "site" && (
          <div className="mt-6 border-t border-line pt-6">
            <p className="label mb-3">Favicon (brauzer tabındakı kiçik ikon)</p>
            <ImageInput value={data.site.favicon} folder="favicon" logo disabled={disabled} onChange={(url) => saveTarget(data, "site", { favicon: url }).then(() => toast("Favicon yeniləndi"))} />
            <p className="mt-2 text-xs text-faint">Kvadrat PNG (məs. 512×512) tövsiyə olunur. Boş qalsa standart ikon göstərilir.</p>
          </div>
        )}
      </Box>

      <Box className="mt-6">
        <h2 className="font-display text-xl font-semibold">{name}: aksent rəngi</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3">
              <input type="color" value={isHex(color) ? color : "#6366f1"} onChange={(e) => setColor(e.target.value)} className="h-14 w-20 cursor-pointer rounded-2xl border border-line2 bg-transparent p-1" aria-label="Rəng seç" />
              <input className="input font-mono" value={color} onChange={(e) => setColor(e.target.value)} aria-label="HEX" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["#2456EE", "#14B8A6", "#10B981", "#FF3B5C", "#8B5CF6", "#6366F1", "#F59E0B", "#E09F7D", "#06B6D4", "#EC4899"].map((c) => (
                <button key={c} className={cx("h-8 w-8 rounded-full border-2 transition-transform hover:scale-110", color.toLowerCase() === c.toLowerCase() ? "border-fg" : "border-transparent")} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button className="btn btn-primary btn-sm" style={{ background: isHex(color) ? color : undefined, color: isHex(color) ? onColor(color) : undefined }} disabled={disabled || !isHex(color) || color === obj.accent}
                onClick={() => saveTarget(data, t, { accent: color }).then(() => toast("Rəng saxlanıldı")).catch((e) => toast(e.message, "err"))}>Yadda saxla</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setColor(obj.accent)} disabled={color === obj.accent}>Ləğv et</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setColor(def)}>Defolt ({def})</button>
            </div>
            {!isHex(color) && <p className="mt-2 text-xs text-danger">HEX formatı: #RRGGBB</p>}
          </div>
          <div className="rounded-2xl border border-line2 bg-bg p-5" style={isHex(color) ? ({ ["--accent" as string]: color, ["--on-accent" as string]: onColor(color) } as React.CSSProperties) : undefined} aria-label="Canlı önbaxış">
            <p className="eyebrow mb-3">Canlı önbaxış</p>
            <p className="eyebrow mb-2 flex items-center gap-2"><span className="h-px w-8 bg-accent-text/70" /> 02 / <span className="eyebrow-accent">Haqqımızda</span></p>
            <p className="font-display text-2xl font-semibold"><span className="text-gradient">{preview.name}</span> səhifəsi</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="btn btn-primary btn-sm">Qoşul <Icon name="arrow" size={14} /></span>
              <span className="btn btn-ghost btn-sm">Necə işləyirik</span>
              <span className="tag tag-accent">Workshop</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {[1, 2, 3].map((n) => <span key={n} className={cx("grid h-9 w-9 place-items-center rounded-full border font-mono text-xs", n === 1 ? "border-accent bg-accent text-on-accent" : "border-line2 text-faint")}>0{n}</span>)}
              <span className="h-px flex-1 bg-accent" />
            </div>
          </div>
        </div>
      </Box>
    </>
  );
}

// ─────────────────────────── Mətnlər ───────────────────────────
const item2 = (title = "Başlıq", text = "Mətn", ttype: "l" | "ltext" = "ltext"): FieldDef[] => [
  { k: "title", label: title, type: "l", full: true },
  { k: "text", label: text, type: ttype, full: true },
];
const newItem = () => ({ title: { az: "", en: "" }, text: { az: "", en: "" } });
const itemTitle = (x: Record<string, unknown>) => L(x.title);

const HERO_FIELDS: FieldDef[] = [
  { k: "h1", label: "Hero (ilk ekran)", type: "heading", hint: "Başlıqda hər sətir ayrı cümlədir. Motto yazmamaq tövsiyə olunur." },
  { k: "hero.badges", label: "Nömrəli kiçik badge-lər (01, 02, 03)", type: "llist", max: 3 },
  { k: "hero.title", label: "Böyük başlıq (sətir-sətir)", type: "ltext" },
  { k: "hero.subtitle", label: "Alt mətn", type: "ltext" },
];
const COMMUNITY_TEXT_FIELDS: FieldDef[] = [
  ...HERO_FIELDS,
  { k: "h2", label: "Haqqımızda", type: "heading" },
  { k: "about.title", label: "Başlıq", type: "l", full: true },
  { k: "about.text", label: "Mətn", type: "ltext" },
  { k: "about.compare", label: "Müqayisə cədvəli: adi klub → biz", type: "list", of: [{ k: "old", label: "Adi klub", type: "l", full: true }, { k: "now", label: "Biz", type: "l", full: true }], newItem: () => ({ old: { az: "", en: "" }, now: { az: "", en: "" } }), itemTitle: (x) => `${L(x.old)} → ${L(x.now)}` },
  { k: "about.values", label: "Dəyər kartları", type: "list", of: item2(), newItem, itemTitle, max: 6 },
  { k: "about.keywords", label: "Açar sözlər (marquee)", type: "tags", full: true },
  { k: "h3", label: "Nə edirik", type: "heading", hint: "Pipeline addımları avtomatik keçir; ən yaxşısı 3–6 addım." },
  { k: "work.title", label: "Başlıq", type: "l", full: true },
  { k: "work.intro", label: "Giriş mətni", type: "ltext" },
  { k: "work.steps", label: "Addımlar", type: "list", of: [...item2(), { k: "result", label: "Nəticə", type: "l", full: true }], newItem: () => ({ ...newItem(), result: { az: "", en: "" } }), itemTitle, max: 8 },
  { k: "work.daily", label: "Gündəlik işimiz", type: "list", of: item2(), newItem, itemTitle },
  { k: "h4", label: "Rollar və qoşulma", type: "heading" },
  { k: "roles.title", label: "Başlıq", type: "l", full: true },
  { k: "roles.intro", label: "Giriş mətni", type: "ltext" },
  { k: "roles.items", label: "Rol kartları", type: "list", of: item2(), newItem, itemTitle, max: 6 },
  { k: "roles.join", label: "Necə qoşulmaq olar (addımlar)", type: "list", of: item2(), newItem, itemTitle, max: 5 },
];
const SITE_TEXT_FIELDS: FieldDef[] = [
  { k: "name", label: "Saytın adı", type: "l", full: true },
  ...HERO_FIELDS,
  { k: "h2", label: "Haqqımızda", type: "heading" },
  { k: "about.title", label: "Başlıq", type: "l", full: true },
  { k: "about.text", label: "Mətn", type: "ltext" },
  { k: "about.keywords", label: "Açar sözlər (marquee)", type: "tags", full: true },
];

function DraftEditor({ data, t, fields, pick, me }: { data: AdminData; t: Target; fields: FieldDef[]; pick: string[]; me: Me }) {
  const src = t === "site" ? data.site : data.communities[t];
  const initial = useMemo(() => Object.fromEntries(pick.map((k) => [k, (src as unknown as Record<string, unknown>)[k]])), [src, pick]);
  const [draft, setDraft] = useState<Record<string, unknown>>(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!dirty) setDraft(initial);
  }, [initial, dirty]);
  useEffect(() => {
    setDirty(false);
  }, [t]);
  const save = async () => {
    setBusy(true);
    try {
      await saveTarget(data, t, JSON.parse(JSON.stringify(draft)));
      setDirty(false);
      toast("Saxlanıldı. Saytda dərhal görünür.");
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Box>
        <SchemaForm fields={fields} value={draft} onChange={(v) => { setDraft(v); setDirty(true); }} disabled={!data.seeded || !canEdit(me, t === "site" ? null : t) && me.role !== "super"} />
      </Box>
      <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-end gap-3 rounded-2xl border border-line2 bg-surface-solid/90 p-3 shadow-xl backdrop-blur">
        {dirty && <span className="mr-auto pl-2 text-sm text-amber-300">Yadda saxlanmamış dəyişikliklər var</span>}
        <button className="btn btn-ghost btn-sm" disabled={!dirty} onClick={() => { setDraft(initial); setDirty(false); }}>Ləğv et</button>
        <button className="btn btn-primary btn-sm" disabled={!dirty || busy || !data.seeded} onClick={save}>{busy ? "Saxlanılır…" : "Yadda saxla"}</button>
      </div>
    </>
  );
}

export function TextsPanel({ me, data }: { me: Me; data: AdminData }) {
  const [t, setT] = useTarget(me);
  return (
    <>
      <PanelHead title="Mətnlər" lead="Hero başlıqları, haqqımızda, nə edirik addımları və rollar. Hər sahə AZ və EN." />
      <NeedSeed data={data} me={me} />
      <TargetPicker me={me} value={t} onChange={setT} data={data} />
      <DraftEditor key={t} data={data} t={t} me={me} fields={t === "site" ? SITE_TEXT_FIELDS : COMMUNITY_TEXT_FIELDS} pick={t === "site" ? ["name", "hero", "about"] : ["hero", "about", "work", "roles"]} />
    </>
  );
}

const LINK_FIELDS: FieldDef[] = [
  { k: "h1", label: "Linklər", type: "heading", hint: "Boş qalan link saytda görünmür." },
  { k: "links.whatsapp", label: "WhatsApp qrupu", type: "url", placeholder: "https://chat.whatsapp.com/…" },
  { k: "links.instagram", label: "Instagram", type: "url" },
  { k: "links.tiktok", label: "TikTok", type: "url" },
  { k: "links.linkedin", label: "LinkedIn", type: "url" },
  { k: "links.telegram", label: "Telegram", type: "url" },
  { k: "links.email", label: "E-poçt", type: "email" },
];
export function InfoPanel({ me, data }: { me: Me; data: AdminData }) {
  const [t, setT] = useTarget(me);
  const fields: FieldDef[] = t === "site"
    ? [...LINK_FIELDS, { k: "h2", label: "Statistika", type: "heading", hint: "0 olan rəqəm saytda göstərilmir. Üzv sayı 0-dırsa icmaların cəmi götürülür, tədbir sayı 0-dırsa tədbirlər siyahısından sayılır." },
      { k: "stats.members", label: "Ümumi üzv sayı", type: "number" }, { k: "stats.events", label: "Tədbir sayı", type: "number" }, { k: "stats.partners", label: "Tərəfdaş sayı", type: "number" }]
    : [{ k: "h0", label: "Əsas məlumat", type: "heading" }, { k: "name", label: "İcmanın adı", type: "text" }, { k: "field", label: "Sahə", type: "l", full: true },
      ...LINK_FIELDS, { k: "h2", label: "Statistika", type: "heading", hint: "0 olan rəqəm saytda göstərilmir." },
      { k: "stats.members", label: "Üzv sayı", type: "number" }, { k: "stats.events", label: "Keçirilən tədbir", type: "number" }, { k: "stats.projects", label: "Layihə sayı", type: "number" }];
  return (
    <>
      <PanelHead title="Linklər və statistika" lead="WhatsApp, Instagram, TikTok, LinkedIn, e-poçt və rəqəmlər." />
      <NeedSeed data={data} me={me} />
      <TargetPicker me={me} value={t} onChange={setT} data={data} />
      <DraftEditor key={t} data={data} t={t} me={me} fields={fields} pick={t === "site" ? ["links", "stats"] : ["name", "field", "links", "stats"]} />
    </>
  );
}

// ─────────────────────────── Kolleksiyalar (CRUD) ───────────────────────────
type Kind = "events" | "team" | "mentors" | "partners" | "faqs";
const commOpts = COMMUNITY_IDS.map((c) => ({ v: c, label: NAMES[c] }));
const scopeOpts = [{ v: "all", label: "Ortaq (hamısı)" }, ...commOpts];

const CFG: Record<Kind, { title: string; lead: string; col: ColName; sortable: boolean; withAll: boolean; fields: FieldDef[]; blank: (scope: string) => Record<string, unknown>; titleOf: (x: Row) => string; subOf: (x: Row) => string; imgOf?: (x: Row) => string }> = {
  events: {
    title: "Tədbirlər", lead: "Tədbir əlavə et, şəkil qalereyası yüklə, qeydiyyatı aç/bağla və iştirakçı siyahısını CSV kimi yüklə.", col: "events", sortable: false, withAll: false,
    fields: [
      { k: "title", label: "Ad", type: "l", full: true },
      { k: "slug", label: "Link (slug)", type: "text", hint: "Boş qalsa addan avtomatik yaranır. Məs. python-workshop-2026-12-04" },
      { k: "community", label: "Təşkilatçı icma", type: "select", options: commOpts },
      { k: "with", label: "Birgə icmalar", type: "multi", options: commOpts, full: true },
      { k: "type", label: "Növ (Workshop, Hakaton…)", type: "l", full: true },
      { k: "date", label: "Tarix", type: "date" },
      { k: "time", label: "Saat", type: "text", placeholder: "12:00–13:00" },
      { k: "place", label: "Məkan", type: "l", full: true },
      { k: "participants", label: "İştirakçı sayı (mətn)", type: "text", placeholder: "50+" },
      { k: "capacity", label: "Yer sayı (0 = limitsiz)", type: "number" },
      { k: "summary", label: "Qısa təsvir", type: "ltext" },
      { k: "body", label: "Proqram / ətraflı (hər sətir ayrı; \"12:00–12:20 — …\" formatı vaxt xətti kimi göstərilir)", type: "ltext" },
      { k: "cover", label: "Üz qabığı şəkli", type: "image", folder: "events" },
      { k: "winners", label: "Qaliblər (sıra ilə)", type: "tags", full: true },
      { k: "gallery", label: "Foto qalereya", type: "gallery", folder: "events" },
      { k: "registrationOpen", label: "Qeydiyyat açıqdır", type: "toggle" },
      { k: "published", label: "Saytda göstər", type: "toggle" },
    ],
    blank: (s) => ({ title: { az: "", en: "" }, slug: "", community: s, with: [], type: { az: "Workshop", en: "Workshop" }, date: new Date().toISOString().slice(0, 10), time: "", place: { az: "", en: "" }, summary: { az: "", en: "" }, body: { az: "", en: "" }, cover: "", gallery: [], participants: "", winners: [], registrationOpen: true, capacity: 0, published: true }),
    titleOf: (x) => L(x.title), subOf: (x) => `${x.date ?? ""} · ${NAMES[x.community as CommunityId] ?? ""}${(x.with as string[] | undefined)?.length ? " · birgə" : ""}${x.published === false ? " · gizli" : ""}`, imgOf: (x) => String(x.cover ?? ""),
  },
  team: {
    title: "Komanda", lead: "Üzv əlavə et, foto yüklə və sıranı sürüşdürərək dəyiş. \"Rəhbər\" seçilən üzv böyük kartda göstərilir.", col: "team", sortable: true, withAll: false,
    fields: [
      { k: "name", label: "Ad və soyad", type: "text" }, { k: "community", label: "İcma", type: "select", options: commOpts },
      { k: "role", label: "Vəzifə", type: "l", full: true }, { k: "bio", label: "Qısa bio", type: "ltext" },
      { k: "photo", label: "Foto", type: "image", folder: "team" }, { k: "linkedin", label: "LinkedIn", type: "url" }, { k: "lead", label: "Rəhbər (böyük kart)", type: "toggle" },
    ],
    blank: (s) => ({ name: "", community: s, role: { az: "", en: "" }, bio: { az: "", en: "" }, photo: "", linkedin: "", lead: false, order: 99 }),
    titleOf: (x) => String(x.name ?? ""), subOf: (x) => `${L(x.role)}${x.lead ? " · Rəhbər" : ""}`, imgOf: (x) => String(x.photo ?? ""),
  },
  mentors: {
    title: "Mentorlar", lead: "Foto yoxdursa saytda baş hərflər göstərilir.", col: "mentors", sortable: true, withAll: false,
    fields: [{ k: "name", label: "Ad və soyad", type: "text" }, { k: "community", label: "İcma", type: "select", options: commOpts }, { k: "field", label: "Sahə", type: "l", full: true }, { k: "photo", label: "Foto", type: "image", folder: "mentors" }, { k: "linkedin", label: "LinkedIn", type: "url" }],
    blank: (s) => ({ name: "", community: s, field: { az: "Mentor", en: "Mentor" }, photo: "", linkedin: "", order: 99 }),
    titleOf: (x) => String(x.name ?? ""), subOf: (x) => L(x.field), imgOf: (x) => String(x.photo ?? ""),
  },
  partners: {
    title: "Tərəfdaşlar", lead: "\"Ortaq\" tərəfdaşlar ana səhifədə, icmaya aid olanlar icma səhifəsində görünür.", col: "partners", sortable: true, withAll: true,
    fields: [{ k: "name", label: "Ad", type: "text" }, { k: "community", label: "Kimin tərəfdaşı", type: "select", options: scopeOpts }, { k: "desc", label: "Qısa təsvir", type: "l", full: true }, { k: "logo", label: "Loqo", type: "image", folder: "partners", logo: true }, { k: "url", label: "Sayt", type: "url" }],
    blank: (s) => ({ name: "", community: s, desc: { az: "", en: "" }, logo: "", url: "", order: 99 }),
    titleOf: (x) => String(x.name ?? ""), subOf: (x) => (x.community === "all" ? "Ortaq" : NAMES[x.community as CommunityId] ?? ""), imgOf: (x) => String(x.logo ?? ""),
  },
  faqs: {
    title: "FAQ", lead: "Sual-cavablar. \"Ortaq\" olanlar ana səhifədə, icmaya aid olanlar icma səhifəsində.", col: "faqs", sortable: true, withAll: true,
    fields: [{ k: "community", label: "Harada göstərilsin", type: "select", options: scopeOpts }, { k: "q", label: "Sual", type: "l", full: true }, { k: "a", label: "Cavab", type: "ltext" }],
    blank: (s) => ({ community: s, q: { az: "", en: "" }, a: { az: "", en: "" }, order: 99 }),
    titleOf: (x) => L(x.q), subOf: (x) => (x.community === "all" ? "Ortaq" : NAMES[x.community as CommunityId] ?? ""),
  },
};

function SortRow({ x, cfg, onEdit, onDelete, disabled }: { x: Row; cfg: (typeof CFG)[Kind]; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={x} dragListener={false} dragControls={controls} className="list-none">
      <RowCard x={x} cfg={cfg} onEdit={onEdit} onDelete={onDelete} disabled={disabled}
        handle={<button className="grid h-9 w-7 cursor-grab place-items-center text-faint active:cursor-grabbing" onPointerDown={(e) => !disabled && controls.start(e)} aria-label="Sürüşdür" style={{ touchAction: "none" }}><Icon name="grip" size={16} /></button>} />
    </Reorder.Item>
  );
}

function RowCard({ x, cfg, onEdit, onDelete, disabled, handle }: { x: Row; cfg: (typeof CFG)[Kind]; onEdit: () => void; onDelete: () => void; disabled: boolean; handle?: React.ReactNode }) {
  const img = cfg.imgOf?.(x);
  return (
    <div className="card flex items-center gap-3 p-3 pr-4">
      {handle}
      {cfg.imgOf && (img ? <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface2"><Img src={img} alt="" fill sizes="96px" className="object-cover" /></span>
        : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/12 font-display text-sm font-semibold text-accent-text">{initials(cfg.titleOf(x) || "?")}</span>)}
      <button className="min-w-0 flex-1 text-left" onClick={onEdit}>
        <p className="truncate font-semibold">{cfg.titleOf(x) || "(adsız)"}</p>
        <p className="truncate text-xs text-faint">{cfg.subOf(x)}</p>
      </button>
      <button className="icon-btn" onClick={onEdit} aria-label="Redaktə et"><Icon name="edit" size={15} /></button>
      <button className="icon-btn hover:text-danger" onClick={onDelete} disabled={disabled} aria-label="Sil"><Icon name="trash" size={15} /></button>
    </div>
  );
}

export function CollectionsPanel({ kind, me, data }: { kind: Kind; me: Me; data: AdminData }) {
  const cfg = CFG[kind];
  const rows = data[kind] as Row[];
  const scopes = [...(cfg.withAll && me.role === "super" ? ["all"] : []), ...COMMUNITY_IDS.filter((c) => canEdit(me, c))];
  const [scope, setScope] = useState<string>(kind === "events" && me.role === "super" ? "*" : scopes[0]!);
  const [edit, setEdit] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const list = useMemo(() => {
    const l = rows.filter((r) => (scope === "*" ? true : kind === "events" ? r.community === scope || (r.with as string[] | undefined)?.includes(scope) : r.community === scope));
    return kind === "events" ? [...l].sort((a, b) => String(b.date).localeCompare(String(a.date))) : [...l].sort((a, b) => Number(a.order ?? 99) - Number(b.order ?? 99));
  }, [rows, scope, kind]);
  const [order, setOrder] = useState<Row[]>(list);
  useEffect(() => setOrder(list), [list]);
  const saveOrder = async () => {
    try {
      await Promise.all(order.map((r, i) => (Number(r.order) !== i + 1 ? updateDoc(cfg.col, r.id, { order: i + 1 }) : null)));
      toast("Sıra yadda saxlanıldı");
    } catch (e) { toast((e as Error).message, "err"); }
  };
  const orderChanged = order.some((r, i) => r.id !== list[i]?.id);
  const del = async (x: Row) => {
    if (!canEdit(me, String(x.community))) return toast("Bu elementi silməyə icazən yoxdur", "err");
    if (!confirm(`"${cfg.titleOf(x)}" silinsin? Bu əməliyyat geri qaytarılmır.`)) return;
    try { await removeDoc(cfg.col, x.id); toast("Silindi"); } catch (e) { toast((e as Error).message, "err"); }
  };
  const scopeForNew = scope === "*" ? (me.community ?? "datatech") : scope;
  return (
    <>
      <PanelHead title={cfg.title} lead={cfg.lead} right={<button className="btn btn-primary btn-sm" disabled={!data.seeded} onClick={() => { setEdit({ id: "", ...cfg.blank(scopeForNew) } as Row); setIsNew(true); }}><Icon name="plus" size={14} /> Yeni</button>} />
      <NeedSeed data={data} me={me} />
      <div className="mb-5 flex flex-wrap gap-2">
        {kind === "events" && me.role === "super" && <button className="chip" aria-pressed={scope === "*"} onClick={() => setScope("*")}>Hamısı</button>}
        {scopes.map((s) => (
          <button key={s} className="chip" aria-pressed={scope === s} onClick={() => setScope(s)}>
            {s !== "all" && <span className="dot" style={{ background: data.communities[s as CommunityId].accent }} />}
            {s === "all" ? "Ortaq" : NAMES[s as CommunityId]}
          </button>
        ))}
      </div>
      {!order.length ? (
        <Box><p className="text-sm text-muted">Hələ heç nə yoxdur. &quot;Yeni&quot; düyməsi ilə əlavə et.</p></Box>
      ) : cfg.sortable ? (
        <>
          <Reorder.Group axis="y" values={order} onReorder={setOrder} className="space-y-2">
            {order.map((x) => <SortRow key={x.id} x={x} cfg={cfg} disabled={!canEdit(me, String(x.community))} onEdit={() => { setEdit(x); setIsNew(false); }} onDelete={() => del(x)} />)}
          </Reorder.Group>
          {orderChanged && (
            <div className="sticky bottom-4 mt-4 flex justify-end gap-2 rounded-2xl border border-line2 bg-surface-solid/90 p-3 backdrop-blur">
              <button className="btn btn-ghost btn-sm" onClick={() => setOrder(list)}>Ləğv et</button>
              <button className="btn btn-primary btn-sm" onClick={saveOrder}>Sıranı yadda saxla</button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          {order.map((x) => <RowCard key={x.id} x={x} cfg={cfg} disabled={!canEdit(me, String(x.community))} onEdit={() => { setEdit(x); setIsNew(false); }} onDelete={() => del(x)} />)}
        </div>
      )}
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={isNew ? `Yeni: ${cfg.title}` : cfg.titleOf(edit ?? ({} as Row)) || cfg.title} wide>
        {edit && <ItemEditor kind={kind} me={me} data={data} item={edit} isNew={isNew} onDone={() => setEdit(null)} />}
      </Modal>
    </>
  );
}

function ItemEditor({ kind, me, data, item, isNew, onDone }: { kind: Kind; me: Me; data: AdminData; item: Row; isNew: boolean; onDone: () => void }) {
  const cfg = CFG[kind];
  const [d, setD] = useState<Row>(item);
  const [busy, setBusy] = useState(false);
  const fields = cfg.fields.map((f) => {
    if (f.k === "community" && f.type === "select" && me.role !== "super") return { ...f, options: f.options.filter((o) => o.v === me.community) };
    return f;
  });
  const save = async () => {
    if (!canEdit(me, String(d.community))) return toast("Bu icma üçün icazən yoxdur", "err");
    setBusy(true);
    try {
      let id = d.id;
      const out: Record<string, unknown> = { ...d };
      if (kind === "events") {
        const slug = slugify(String(d.slug || "") || `${L(d.title)}-${d.date}`) || uid();
        out.slug = slug;
        out.with = ((d.with as string[]) ?? []).filter((c) => c !== d.community);
        if (!id) id = slug;
        if (isNew && data.events.some((e) => e.id === id)) id = `${slug}-${uid().slice(0, 4)}`;
      }
      if (!id) id = `${d.community}-${uid()}`;
      if (isNew && cfg.sortable) out.order = (data[kind] as Row[]).filter((r) => r.community === d.community).length + 1;
      await setDoc(cfg.col, id, out);
      toast("Saxlanıldı");
      onDone();
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <SchemaForm fields={fields} value={d} onChange={setD} />
      {kind === "events" && !isNew && <Registrations event={item} data={data} />}
      <div className="sticky bottom-0 -mx-6 mt-6 flex justify-end gap-2 border-t border-line bg-surface-solid px-6 pt-4 md:-mx-8 md:px-8">
        <button className="btn btn-ghost btn-sm" onClick={onDone}>Ləğv et</button>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? "Saxlanılır…" : "Yadda saxla"}</button>
      </div>
    </div>
  );
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function Registrations({ event, data }: { event: Row; data: AdminData }) {
  const regs = data.registrations.filter((r) => r.eventId === event.id).sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
  return (
    <div className="mt-8 border-t border-line pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Qeydiyyatlar ({regs.length})</h3>
        <button className="btn btn-ghost btn-sm" disabled={!regs.length} onClick={() => downloadCsv(`${event.slug || event.id}-istirakcilar.csv`, [["#", "Ad", "Əlaqə", "Qrup", "Qeyd", "Tarix"], ...regs.map((r, i) => [i + 1, String(r.name), String(r.contact), String(r.group ?? ""), String(r.note ?? ""), fmtTime(r.createdAt)])])}>
          <Icon name="download" size={14} /> CSV ixrac
        </button>
      </div>
      {regs.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table w-full min-w-[520px]">
            <thead><tr><th>#</th><th>Ad</th><th>Əlaqə</th><th>Qrup</th><th>Tarix</th></tr></thead>
            <tbody>{regs.map((r, i) => <tr key={r.id}><td>{i + 1}</td><td>{String(r.name)}</td><td>{String(r.contact)}</td><td>{String(r.group ?? "")}</td><td className="text-faint">{fmtTime(r.createdAt)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Problem Bank ───────────────────────────
export function ProblemsPanel({ me, data }: { me: Me; data: AdminData }) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [open, setOpen] = useState<string | null>(null);
  const visible = data.problems.filter((p) => me.role === "super" || p.community === me.community || p.community === "all");
  const list = visible.filter((p) => status === "all" || p.status === status).sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  const upd = async (p: Row, patch: Record<string, unknown>, msg: string) => {
    try { await updateDoc("problems", p.id, patch); toast(msg); } catch (e) { toast((e as Error).message, "err"); }
  };
  const counts = { pending: 0, approved: 0, rejected: 0 } as Record<string, number>;
  visible.forEach((p) => (counts[String(p.status)] = (counts[String(p.status)] ?? 0) + 1));
  return (
    <>
      <PanelHead title="Problem Bank" lead="Gələn problemləri təsdiqlə, rədd et, icmaya yönləndir və təsdiqlənəni saytda göstər." />
      <div className="mb-5 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button key={s} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
            {{ pending: "Gözləyən", approved: "Təsdiqlənən", rejected: "Rədd edilən", all: "Hamısı" }[s]}
            {s !== "all" && <span className="opacity-70">{counts[s] ?? 0}</span>}
          </button>
        ))}
      </div>
      {!list.length ? <Box><p className="text-sm text-muted">Bu bölmədə problem yoxdur.</p></Box> : (
        <ul className="space-y-3">
          {list.map((p) => {
            const ok = canEdit(me, String(p.community)) || me.role === "super";
            return (
              <li key={p.id} className="card p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
                    <p className="font-semibold">{String(p.title)}</p>
                    <p className="mt-1 text-xs text-faint">
                      {p.community === "all" ? "Hamısı" : NAMES[p.community as CommunityId]} · {p.category ? catLabel("az", String(p.category)) : "kateqoriyasız"} · {fmtTime(p.createdAt)}
                    </p>
                  </button>
                  <span className={cx("tag", p.status === "approved" && "border-ok/40 text-ok", p.status === "rejected" && "border-danger/40 text-danger")}>{{ pending: "Gözləyir", approved: "Təsdiqləndi", rejected: "Rədd edildi" }[String(p.status)] ?? String(p.status)}</span>
                  {p.public === true && <span className="tag tag-accent"><Icon name="eye" size={12} /> Saytda</span>}
                </div>
                {open === p.id && (
                  <dl className="mt-4 grid gap-3 rounded-2xl bg-surface2 p-4 text-sm md:grid-cols-2">
                    <div className="md:col-span-2"><dt className="text-faint">Problem</dt><dd className="whitespace-pre-wrap">{String(p.description || "—")}</dd></div>
                    <div><dt className="text-faint">Kimləri narahat edir</dt><dd>{String(p.affected || "—")}</dd></div>
                    <div><dt className="text-faint">İndi necə həll edirlər</dt><dd>{String(p.current || "—")}</dd></div>
                    <div><dt className="text-faint">Göndərən</dt><dd>{String(p.name || "anonim")}</dd></div>
                    <div><dt className="text-faint">Əlaqə</dt><dd>{String(p.contact || "—")}</dd></div>
                  </dl>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {p.status !== "approved" && <button className="btn btn-primary btn-sm" disabled={!ok} onClick={() => upd(p, { status: "approved" }, "Təsdiqləndi")}><Icon name="check" size={14} /> Təsdiqlə</button>}
                  {p.status !== "rejected" && <button className="btn btn-ghost btn-sm" disabled={!ok} onClick={() => upd(p, { status: "rejected", public: false }, "Rədd edildi")}><Icon name="close" size={14} /> Rədd et</button>}
                  {p.status === "approved" && (
                    <label className="flex items-center gap-2 rounded-full border border-line2 px-3 py-1.5 text-sm">
                      Saytda göstər <Switch on={p.public === true} disabled={!ok} onChange={(v) => upd(p, { public: v }, v ? "Saytda göstərilir" : "Saytdan gizlədildi")} label="Saytda göstər" />
                    </label>
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-faint">Yönləndir:</span>
                    <select className="input h-9 min-h-0 w-auto py-0 text-sm" value={String(p.community)} disabled={me.role !== "super" && !ok} onChange={(e) => upd(p, { community: e.target.value }, "Yönləndirildi")}>
                      {(me.role === "super" ? scopeOpts : scopeOpts.filter((o) => o.v === "all" || o.v === me.community)).map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                    </select>
                  </label>
                  {me.role === "super" && <button className="icon-btn ml-auto hover:text-danger" aria-label="Sil" onClick={async () => { if (confirm("Problem silinsin?")) { await removeDoc("problems", p.id); toast("Silindi"); } }}><Icon name="trash" size={15} /></button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

// ─────────────────────────── Suallar və müraciətlər ───────────────────────────
export function InboxPanel({ me, data }: { me: Me; data: AdminData }) {
  const [tab, setTab] = useState<"question" | "contact" | "collab">("question");
  const vis = (r: Row) => me.role === "super" || r.community === me.community || r.community === "all";
  const rows = (tab === "collab" ? data.collabs : data.questions.filter((q) => (q.kind ?? "question") === tab)).filter(vis).sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  const col: ColName = tab === "collab" ? "collabs" : "questions";
  const TYPES: Record<string, string> = { community: "Tərəfdaş icma", sponsor: "Sponsor", mentor: "Mentor", company: "Şirkət" };
  const count = (k: typeof tab) => (k === "collab" ? data.collabs : data.questions.filter((q) => (q.kind ?? "question") === k)).filter(vis).filter((r) => !r.answered).length;
  return (
    <>
      <PanelHead title="Suallar və müraciətlər" lead="FAQ sualları, əlaqə mesajları və əməkdaşlıq müraciətləri. Cavab verəndən sonra \&quot;cavablandı\&quot; qeyd et." />
      <div className="mb-5 flex flex-wrap gap-2">
        {([["question", "Suallar"], ["contact", "Mesajlar"], ["collab", "Əməkdaşlıq"]] as const).map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>{l} <span className="opacity-70">{count(k)}</span></button>
        ))}
      </div>
      {!rows.length ? <Box><p className="text-sm text-muted">Hələ heç nə gəlməyib.</p></Box> : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const contact = String(r.contact || "");
            const email = /@/.test(contact);
            return (
              <li key={r.id} className={cx("card p-5", r.answered === true && "opacity-60")}>
                <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
                  {tab === "collab" && <span className="tag tag-accent">{TYPES[String(r.type)] ?? String(r.type)}</span>}
                  <span>{r.community === "all" ? "Hamısı" : NAMES[r.community as CommunityId]}</span>·<span>{fmtTime(r.createdAt)}</span>
                  {r.category ? <>· <span>{String(r.category)}</span></> : null}
                </div>
                <p className="mt-3 whitespace-pre-wrap">{String(tab === "collab" ? r.message : r.question)}</p>
                <p className="mt-3 text-sm text-muted">{String(r.name || "anonim")}{r.org ? ` · ${String(r.org)}` : ""}{contact ? ` · ${contact}` : ""}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {email && <a className="btn btn-ghost btn-sm" href={`mailto:${contact}`}><Icon name="mail" size={14} /> Cavab yaz</a>}
                  <label className="flex items-center gap-2 rounded-full border border-line2 px-3 py-1.5 text-sm">
                    Cavablandı <Switch on={r.answered === true} onChange={(v) => updateDoc(col, r.id, { answered: v }).then(() => toast(v ? "Cavablandı kimi qeyd edildi" : "Yenidən açıldı"))} label="Cavablandı" />
                  </label>
                  {me.role === "super" && <button className="icon-btn ml-auto hover:text-danger" aria-label="Sil" onClick={async () => { if (confirm("Silinsin?")) { await removeDoc(col, r.id); toast("Silindi"); } }}><Icon name="trash" size={15} /></button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

// ─────────────────────────── QR generator ───────────────────────────
export function QrPanel({ me, data }: { me: Me; data: AdminData }) {
  const [src, setSrc] = useState<Target>(me.role === "super" ? "datatech" : me.community!);
  const c = src === "site" ? null : data.communities[src];
  const [url, setUrl] = useState(c?.links.whatsapp || "");
  const [fg, setFg] = useState("#0B132B");
  const [size, setSize] = useState(1024);
  const [withLogo, setWithLogo] = useState(true);
  const [customLogo, setCustomLogo] = useState("");
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (c) setUrl(c.links.whatsapp || (typeof location !== "undefined" ? `${location.origin}/${c.id}` : "")); }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  const logo = customLogo || (src === "site" ? data.site.logo.dark : c ? c.logo.dark || c.logo.light : "");
  const name = src === "site" ? "BMU" : NAMES[src];
  const accent = src === "site" ? data.site.accent : c!.accent;
  useEffect(() => {
    if (!ref.current) return;
    drawQr(ref.current, url || " ", { size, fg, logo: withLogo ? logo : undefined, logoText: withLogo && !logo ? initials(name.replace(/([a-z])([A-Z])/g, "$1 $2")) : undefined, logoColor: accent }).catch(() => {});
  }, [url, size, fg, withLogo, logo, name, accent]);
  const origin = typeof location !== "undefined" ? location.origin : "";
  const presets = [
    ...COMMUNITY_IDS.filter((id) => data.communities[id].links.whatsapp).map((id) => ({ l: `${NAMES[id]} WhatsApp`, u: data.communities[id].links.whatsapp })),
    { l: "Ana səhifə", u: `${origin}/` }, { l: "Problem Bank", u: `${origin}/problem-bank` }, { l: "Tədbirlər", u: `${origin}/events` },
    ...(c ? [{ l: `${c.name} səhifəsi`, u: `${origin}/${c.id}` }] : []),
  ];
  const download = () => {
    try {
      const a = document.createElement("a");
      a.href = ref.current!.toDataURL("image/png");
      a.download = `qr-${src}-${size}.png`;
      a.click();
    } catch {
      toast("Loqo başqa domendən gəldiyi üçün yükləmək alınmadı. Loqosuz yoxla və ya loqonu yenidən yüklə.", "err");
    }
  };
  return (
    <>
      <PanelHead title="QR generator" lead="Ortasında icma loqosu olan QR (error correction H: loqo kodun bir hissəsini örtsə də oxunur)." />
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <Box>
          <p className="label mb-2">Loqo</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {(["site", ...COMMUNITY_IDS] as Target[]).map((t) => (
              <button key={t} className="chip" aria-pressed={src === t} onClick={() => { setSrc(t); setCustomLogo(""); }}>
                {t === "site" ? "Ortaq" : NAMES[t]}
              </button>
            ))}
          </div>
          <label className="field">
            <span className="label">Hədəf link</span>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {presets.map((p) => <button key={p.l} className="chip" onClick={() => setUrl(p.u)}>{p.l}</button>)}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="field"><span className="label">Rəng</span>
              <div className="flex items-center gap-2"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-11 w-14 rounded-xl border border-line2 bg-transparent p-1" aria-label="QR rəngi" /><input className="input font-mono" value={fg} onChange={(e) => setFg(e.target.value)} /></div>
            </label>
            <label className="field"><span className="label">Ölçü</span>
              <select className="input" value={size} onChange={(e) => setSize(Number(e.target.value))}>{[512, 1024, 2048].map((s) => <option key={s} value={s}>{s}×{s}</option>)}</select>
            </label>
          </div>
          <label className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-line2 px-4 py-3 text-sm">Ortada loqo <Switch on={withLogo} onChange={setWithLogo} label="Ortada loqo" /></label>
          <div className="mt-4">
            <p className="label mb-2">Başqa loqo (istəyə bağlı)</p>
            <ImageInput value={customLogo} onChange={setCustomLogo} folder="qr" logo />
          </div>
        </Box>
        <Box className="flex flex-col items-center">
          <canvas ref={ref} width={size} height={size} className="aspect-square w-full max-w-[320px] rounded-2xl bg-white" aria-label="QR önbaxış" />
          <p className="mt-3 break-all text-center text-xs text-faint">{url || "Link daxil et"}</p>
          <button className="btn btn-primary mt-5" onClick={download} disabled={!url}><Icon name="download" size={16} /> PNG yüklə</button>
        </Box>
      </div>
    </>
  );
}

// ─────────────────────────── Adminlər ───────────────────────────
export function AdminsPanel({ me }: { me: Me }) {
  const [rows, setRows] = useState<(AdminRole & { id: string })[]>([]);
  const [err, setErr] = useState("");
  const [f, setF] = useState<{ email: string; role: "super" | "community"; community: CommunityId }>({ email: "", role: "community", community: "datatech" });
  useEffect(() => subscribeCol<AdminRole & { id: string }>("admins", setRows, (e) => setErr(e.message)), []);
  const add = async () => {
    const email = f.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast("E-poçt düzgün deyil", "err");
    try {
      await setDoc("admins", email, { email, role: f.role, ...(f.role === "community" ? { community: f.community } : {}) });
      setF((s) => ({ ...s, email: "" }));
      toast("Admin əlavə edildi");
    } catch (e) { toast((e as Error).message, "err"); }
  };
  return (
    <>
      <PanelHead title="Adminlər" lead="Baş admin hər şeyi, icma admini yalnız öz icmasını redaktə edir. Giriş Google hesabı ilə olur." />
      {err && <Box className="mb-4 border-danger/40 text-sm text-danger">{err}</Box>}
      <Box>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <label className="field"><span className="label">Google e-poçtu</span><input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="ad@gmail.com" /></label>
          <label className="field"><span className="label">Rol</span>
            <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as "super" | "community" })}><option value="community">İcma admini</option><option value="super">Baş admin</option></select>
          </label>
          <label className="field"><span className="label">İcma</span>
            <select className="input" value={f.community} disabled={f.role === "super"} onChange={(e) => setF({ ...f, community: e.target.value as CommunityId })}>{commOpts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select>
          </label>
          <button className="btn btn-primary" onClick={add}><Icon name="plus" size={14} /> Əlavə et</button>
        </div>
      </Box>
      <ul className="mt-5 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card flex items-center gap-3 p-4">
            <Icon name="shield" size={18} className="text-accent-text" />
            <span className="min-w-0 flex-1 truncate font-medium">{r.email || r.id}</span>
            <span className="tag">{r.role === "super" ? "Baş admin" : `${NAMES[r.community as CommunityId] ?? r.community} admini`}</span>
            <button className="icon-btn hover:text-danger" aria-label="Sil" disabled={r.id === me.email} onClick={async () => { if (confirm(`${r.id} admin siyahısından çıxarılsın?`)) { await removeDoc("admins", r.id); toast("Silindi"); } }}><Icon name="trash" size={15} /></button>
          </li>
        ))}
        {!rows.length && <li className="text-sm text-muted">Firestore-da hub_admins kolleksiyası boşdur. Env-dəki NEXT_PUBLIC_ADMIN_EMAILS və DataTech-in admins kolleksiyası da baş admin sayılır.</li>}
      </ul>
    </>
  );
}
