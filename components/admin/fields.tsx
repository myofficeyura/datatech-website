"use client";
import { Reorder, useDragControls } from "framer-motion";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Img, toast } from "@/components/ui/bits";
import { uploadImage } from "@/lib/db";
import { cx } from "@/lib/utils";

type Opt = { v: string; label: string };
export type FieldDef =
  | { k: string; label: string; type: "text" | "textarea" | "url" | "email" | "number" | "date" | "color"; hint?: string; placeholder?: string; full?: boolean }
  | { k: string; label: string; type: "l" | "ltext"; hint?: string; full?: boolean }
  | { k: string; label: string; type: "toggle"; hint?: string }
  | { k: string; label: string; type: "select"; options: Opt[]; hint?: string }
  | { k: string; label: string; type: "multi"; options: Opt[]; hint?: string; full?: boolean }
  | { k: string; label: string; type: "image"; folder: string; logo?: boolean; hint?: string }
  | { k: string; label: string; type: "gallery"; folder: string; hint?: string; full?: boolean }
  | { k: string; label: string; type: "tags"; hint?: string; full?: boolean }
  | { k: string; label: string; type: "llist"; hint?: string; max?: number; full?: boolean }
  | { k: string; label: string; type: "list"; of: FieldDef[]; newItem: () => Record<string, unknown>; itemTitle?: (x: Record<string, unknown>, i: number) => string; hint?: string; max?: number; full?: boolean }
  | { k: string; label: string; type: "heading"; hint?: string };

// ───────── Yol köməkçiləri: "hero.title.az" ─────────
export function getPath(o: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Record<string, unknown>)[k] : undefined), o);
}
export function setPath<T>(o: T, path: string, v: unknown): T {
  const keys = path.split(".");
  const clone = (x: unknown) => (Array.isArray(x) ? [...x] : x && typeof x === "object" ? { ...(x as object) } : {});
  const root = clone(o) as Record<string, unknown>;
  let cur = root;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = v;
    else {
      cur[k] = clone(cur[k]);
      cur = cur[k] as Record<string, unknown>;
    }
  });
  return root as T;
}

const L = (v: unknown) => (v && typeof v === "object" ? (v as { az?: string; en?: string }) : { az: "", en: "" });

export function SchemaForm<T extends Record<string, unknown>>({ fields, value, onChange, disabled }: { fields: FieldDef[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {fields.map((f) => (
        <FieldRow key={f.k} f={f} value={getPath(value, f.k)} onChange={(v) => onChange(setPath(value, f.k, v))} disabled={disabled} />
      ))}
    </div>
  );
}

function FieldRow({ f, value, onChange, disabled }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  const full = f.type === "textarea" || f.type === "ltext" || f.type === "list" || f.type === "gallery" || f.type === "heading" || f.type === "llist" || ("full" in f && f.full);
  const wrap = (child: React.ReactNode) => (
    <div className={cx("grid gap-2", full && "md:col-span-2")}>
      {f.type !== "toggle" && f.type !== "heading" && <span className="label">{f.label}</span>}
      {child}
      {f.hint && f.type !== "heading" && <span className="text-xs text-faint">{f.hint}</span>}
    </div>
  );
  switch (f.type) {
    case "heading":
      return (
        <div className="md:col-span-2 mt-4 border-t border-line pt-5 first:mt-0 first:border-0 first:pt-0">
          <h3 className="font-display text-lg font-semibold">{f.label}</h3>
          {f.hint && <p className="mt-1 text-sm text-faint">{f.hint}</p>}
        </div>
      );
    case "text": case "url": case "email": case "date":
      return wrap(<input className="input" type={f.type === "text" ? "text" : f.type} value={String(value ?? "")} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} disabled={disabled} />);
    case "number":
      return wrap(<input className="input" type="number" min={0} value={Number(value ?? 0)} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} disabled={disabled} />);
    case "color":
      return wrap(
        <div className="flex items-center gap-3">
          <input type="color" className="h-11 w-14 cursor-pointer rounded-xl border border-line2 bg-transparent p-1" value={String(value || "#6366f1")} onChange={(e) => onChange(e.target.value)} disabled={disabled} aria-label={f.label} />
          <input className="input font-mono" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
        </div>,
      );
    case "textarea":
      return wrap(<textarea className="input" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} disabled={disabled} />);
    case "l": case "ltext": {
      const v = L(value);
      const Tag = f.type === "l" ? "input" : "textarea";
      return wrap(
        <div className="grid gap-2 sm:grid-cols-2">
          {(["az", "en"] as const).map((lg) => (
            <div key={lg} className="relative">
              <span className="pointer-events-none absolute right-3 top-2.5 font-mono text-[0.65rem] uppercase text-faint">{lg}</span>
              <Tag className={cx("input pr-10", f.type === "ltext" && "min-h-[110px]")} value={v[lg] ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...v, [lg]: e.target.value })} disabled={disabled} aria-label={`${f.label} (${lg})`} />
            </div>
          ))}
        </div>,
      );
    }
    case "toggle":
      return (
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line2 bg-surface2 px-4 py-3">
          <span>
            <span className="label">{f.label}</span>
            {f.hint && <span className="block text-xs text-faint">{f.hint}</span>}
          </span>
          <Switch on={Boolean(value)} onChange={onChange} disabled={disabled} label={f.label} />
        </label>
      );
    case "select":
      return wrap(
        <select className="input" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          {f.options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
        </select>,
      );
    case "multi": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return wrap(
        <div className="flex flex-wrap gap-2">
          {f.options.map((o) => (
            <button type="button" key={o.v} className="chip" aria-pressed={arr.includes(o.v)} disabled={disabled} onClick={() => onChange(arr.includes(o.v) ? arr.filter((x) => x !== o.v) : [...arr, o.v])}>{o.label}</button>
          ))}
        </div>,
      );
    }
    case "tags": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return wrap(<TagsInput value={arr} onChange={onChange} disabled={disabled} />);
    }
    case "image":
      return wrap(<ImageInput value={String(value ?? "")} onChange={onChange} folder={f.folder} logo={f.logo} disabled={disabled} />);
    case "gallery":
      return wrap(<GalleryInput value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} folder={f.folder} disabled={disabled} />);
    case "llist": {
      const arr = Array.isArray(value) ? (value as { az: string; en: string }[]) : [];
      return wrap(
        <div className="grid gap-2">
          {arr.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
              <input className="input" value={it.az} placeholder="AZ" onChange={(e) => onChange(arr.map((x, j) => (j === i ? { ...x, az: e.target.value } : x)))} disabled={disabled} />
              <input className="input" value={it.en} placeholder="EN" onChange={(e) => onChange(arr.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))} disabled={disabled} />
              <button type="button" className="icon-btn shrink-0" onClick={() => onChange(arr.filter((_, j) => j !== i))} aria-label="Sil" disabled={disabled}><Icon name="trash" size={15} /></button>
            </div>
          ))}
          {(!f.max || arr.length < f.max) && (
            <button type="button" className="btn btn-ghost btn-sm justify-self-start" onClick={() => onChange([...arr, { az: "", en: "" }])} disabled={disabled}><Icon name="plus" size={14} /> Əlavə et</button>
          )}
        </div>,
      );
    }
    case "list": {
      const arr = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
      return wrap(<ListInput f={f} arr={arr} onChange={onChange} disabled={disabled} />);
    }
  }
}

function ListInput({ f, arr, onChange, disabled }: { f: Extract<FieldDef, { type: "list" }>; arr: Record<string, unknown>[]; onChange: (v: unknown) => void; disabled?: boolean }) {
  const [open, setOpen] = useState<number | null>(arr.length ? null : null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    const a = [...arr];
    [a[i], a[j]] = [a[j]!, a[i]!];
    onChange(a);
    setOpen(j);
  };
  return (
    <div className="grid gap-2">
      {arr.map((it, i) => (
        <div key={i} className="rounded-2xl border border-line2 bg-surface2">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
            <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-medium" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              {f.itemTitle?.(it, i) || `#${i + 1}`}
            </button>
            <button type="button" className="icon-btn h-8 w-8" onClick={() => move(i, -1)} aria-label="Yuxarı" disabled={disabled || i === 0}><Icon name="arrowUp" size={14} /></button>
            <button type="button" className="icon-btn h-8 w-8 rotate-180" onClick={() => move(i, 1)} aria-label="Aşağı" disabled={disabled || i === arr.length - 1}><Icon name="arrowUp" size={14} /></button>
            <button type="button" className="icon-btn h-8 w-8" onClick={() => setOpen(open === i ? null : i)} aria-label="Redaktə et"><Icon name="edit" size={14} /></button>
            <button type="button" className="icon-btn h-8 w-8 hover:text-danger" onClick={() => onChange(arr.filter((_, j) => j !== i))} aria-label="Sil" disabled={disabled}><Icon name="trash" size={14} /></button>
          </div>
          {open === i && (
            <div className="border-t border-line p-4">
              <SchemaForm fields={f.of} value={it} onChange={(v) => onChange(arr.map((x, j) => (j === i ? v : x)))} disabled={disabled} />
            </div>
          )}
        </div>
      ))}
      {(!f.max || arr.length < f.max) && (
        <button type="button" className="btn btn-ghost btn-sm justify-self-start" onClick={() => { onChange([...arr, f.newItem()]); setOpen(arr.length); }} disabled={disabled}>
          <Icon name="plus" size={14} /> Əlavə et
        </button>
      )}
    </div>
  );
}

export function Switch({ on, onChange, disabled, label }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
      className={cx("relative h-7 w-12 shrink-0 rounded-full border transition-colors", on ? "border-accent bg-accent" : "border-line2 bg-surface2")}>
      <span className={cx("absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

function TagsInput({ value, onChange, disabled }: { value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...value, ...parts]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line2 bg-surface2 p-2">
      {value.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-accent/15 py-1 pl-3 pr-1 text-sm text-accent-text">
          {t}
          <button type="button" className="grid h-5 w-5 place-items-center rounded-full hover:bg-accent/25" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`${t} sil`} disabled={disabled}><Icon name="close" size={11} /></button>
        </span>
      ))}
      <input className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-sm outline-none" value={draft} placeholder="Yaz və Enter bas" disabled={disabled}
        onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} onBlur={add} />
    </div>
  );
}

export function ImageInput({ value, onChange, folder, logo, disabled, previewBg }: { value: string; onChange: (v: string) => void; folder: string; logo?: boolean; disabled?: boolean; previewBg?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder, { logo }));
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line2" style={{ background: previewBg ?? "var(--surface2)" }}>
        {value ? <Img src={value} alt="" fill sizes="160px" className={logo ? "object-contain p-1" : "object-cover"} /> : <Icon name="image" size={22} className="text-faint" />}
        {busy && <span className="absolute inset-0 grid place-items-center bg-black/50 text-xs text-white">…</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => ref.current?.click()} disabled={disabled || busy}><Icon name="upload" size={14} /> {value ? "Dəyiş" : "Yüklə"}</button>
        {value && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange("")} disabled={disabled}><Icon name="trash" size={14} /> Sil</button>}
      </div>
    </div>
  );
}

function GalleryInput({ value, onChange, folder, disabled }: { value: string[]; onChange: (v: string[]) => void; folder: string; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 20);
    setBusy(list.length);
    const out: string[] = [];
    for (const f of list) {
      try {
        out.push(await uploadImage(f, folder));
      } catch (e) {
        toast((e as Error).message, "err");
      }
      setBusy((b) => b - 1);
    }
    onChange([...value, ...out]);
    if (ref.current) ref.current.value = "";
  };
  return (
    <div>
      <Reorder.Group axis="x" values={value} onReorder={onChange} className="flex flex-wrap gap-2">
        {value.map((src) => <GalleryThumb key={src} src={src} onRemove={() => onChange(value.filter((x) => x !== src))} disabled={disabled} />)}
        <li className="list-none">
          <button type="button" onClick={() => ref.current?.click()} disabled={disabled || busy > 0} className="grid h-24 w-24 place-items-center rounded-2xl border border-dashed border-line2 text-faint hover:border-accent hover:text-accent-text">
            {busy > 0 ? <span className="text-xs">{busy}…</span> : <Icon name="plus" size={22} />}
          </button>
        </li>
      </Reorder.Group>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      <p className="mt-2 text-xs text-faint">Şəkilləri sürüşdürərək sırala. Yükləmədə avtomatik webp-ə çevrilir.</p>
    </div>
  );
}

function GalleryThumb({ src, onRemove, disabled }: { src: string; onRemove: () => void; disabled?: boolean }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={src} dragListener={false} dragControls={controls} className="group relative h-24 w-24 list-none overflow-hidden rounded-2xl border border-line2">
      <Img src={src} alt="" fill sizes="200px" className="object-cover" />
      <button type="button" onPointerDown={(e) => controls.start(e)} className="absolute left-1 top-1 grid h-7 w-7 cursor-grab place-items-center rounded-full bg-black/60 text-white" aria-label="Sürüşdür" style={{ touchAction: "none" }}><Icon name="grip" size={13} /></button>
      <button type="button" onClick={onRemove} disabled={disabled} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-red-600" aria-label="Sil"><Icon name="close" size={13} /></button>
    </Reorder.Item>
  );
}
