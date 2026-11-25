"use client";
// Demo rejimi: Firebase qoşulmayanda bütün məlumat brauzerin localStorage-ında saxlanır.
import { seedClone } from "./seed";
import type { ColName, Content } from "./types";

const KEY = "hub-demo-db-v1";
export const DEMO_EVENT = "hub-demo-change";

export type DemoDB = Partial<Record<ColName, Record<string, Record<string, unknown>>>>;

export function seedToDb(c: Content = seedClone()): DemoDB {
  const byId = <T extends { id: string }>(a: T[]) => Object.fromEntries(a.map((x) => [x.id, x as unknown as Record<string, unknown>]));
  return {
    site: { main: c.site as unknown as Record<string, unknown> },
    communities: Object.fromEntries(Object.values(c.communities).map((x) => [x.id, x as unknown as Record<string, unknown>])),
    events: byId(c.events),
    team: byId(c.team),
    mentors: byId(c.mentors),
    partners: byId(c.partners),
    faqs: byId(c.faqs),
    problems: byId(c.problems),
    questions: {},
    collabs: {},
    registrations: {},
    admins: {},
  };
}

export function demoRead(): DemoDB | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoDB) : null;
  } catch {
    return null;
  }
}

export function demoWrite(db: DemoDB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e) {
    throw new Error("Brauzer yaddaşı doldu (demo rejimi). Daha kiçik şəkil seç.");
  }
  window.dispatchEvent(new Event(DEMO_EVENT));
}

export function demoDb(): DemoDB {
  return demoRead() ?? seedToDb();
}

export function demoReset() {
  demoWrite(seedToDb());
}
