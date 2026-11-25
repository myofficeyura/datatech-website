// Formaların ortaq validasiyası (həm brauzerdə, həm /api/forms-da).
import { COMMUNITY_IDS } from "./types";

export type FormKind = "problem" | "question" | "contact" | "collab" | "registration";
export const FORM_COLLECTION: Record<FormKind, "problems" | "questions" | "collabs" | "registrations"> = {
  problem: "problems", question: "questions", contact: "questions", collab: "collabs", registration: "registrations",
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const scope = (v: unknown) => (typeof v === "string" && (v === "all" || (COMMUNITY_IDS as readonly string[]).includes(v)) ? v : "all");

/** Təmizlənmiş məlumatı qaytarır və ya xəta mətni atır. */
export function cleanForm(kind: FormKind, d: Record<string, unknown>): Record<string, unknown> {
  const now = Date.now();
  switch (kind) {
    case "problem": {
      const o = {
        title: str(d.title, 160), description: str(d.description, 1500), affected: str(d.affected, 300), current: str(d.current, 300),
        category: str(d.category, 30), community: scope(d.community), name: str(d.name, 80), contact: str(d.contact, 120),
        status: "pending", public: false, createdAt: now,
      };
      if (!o.title || !o.description) throw new Error("required");
      return o;
    }
    case "question":
    case "contact": {
      const o = { kind, name: str(d.name, 80), contact: str(d.contact, 120), question: str(d.question, 1000), category: str(d.category, 30), community: scope(d.community), answered: false, createdAt: now };
      if (!o.question) throw new Error("required");
      return o;
    }
    case "collab": {
      const type = ["community", "sponsor", "mentor", "company"].includes(String(d.type)) ? String(d.type) : "community";
      const o = { type, name: str(d.name, 80), org: str(d.org, 120), contact: str(d.contact, 120), message: str(d.message, 1000), community: scope(d.community), answered: false, createdAt: now };
      if (!o.name || !o.contact || !o.message) throw new Error("required");
      return o;
    }
    case "registration": {
      const o = { eventId: str(d.eventId, 80), eventSlug: str(d.eventSlug, 80), name: str(d.name, 80), contact: str(d.contact, 120), group: str(d.group, 80), note: str(d.note, 300), createdAt: now };
      if (!o.eventId || !o.name || !o.contact) throw new Error("required");
      return o;
    }
  }
}
