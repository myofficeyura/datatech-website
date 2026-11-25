// Firestore-dan gələn məlumatı tam tipə çevirir (çatışmayan sahələr defoltla doldurulur).
import { SEED_COMMUNITIES, SEED_SITE } from "./seed";
import type { Community, CommunityId, Content, EventDoc, Faq, Mentor, Partner, Person, Problem, SiteSettings } from "./types";
import { COMMUNITY_IDS } from "./types";

const isObj = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);

/** Dərin birləşdirmə: b-dəki dəyərlər a-nın üstünə yazılır, massivlər tam əvəz olunur. */
export function deepMerge<T>(a: T, b: unknown): T {
  if (!isObj(a) || !isObj(b)) return (b === undefined || b === null ? a : (b as T));
  const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined || v === null) continue;
    out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out as T;
}

const emptyL = { az: "", en: "" };
const emptyLinks = { whatsapp: "", instagram: "", tiktok: "", linkedin: "", telegram: "", email: "" };

export const normSite = (raw: unknown): SiteSettings => {
  const blank: SiteSettings = {
    ...SEED_SITE,
    name: { ...SEED_SITE.name },
    logo: { dark: "", light: "", card: false, history: [] },
    favicon: "",
    links: { ...emptyLinks },
    stats: { members: 0, events: 0, partners: 0 },
    hero: { badges: [], title: { ...emptyL }, subtitle: { ...emptyL } },
    about: { title: { ...emptyL }, text: { ...emptyL }, keywords: [] },
  };
  return deepMerge(blank, raw);
};

export const normCommunity = (id: CommunityId, raw: unknown): Community => {
  const s = SEED_COMMUNITIES[id];
  const blank: Community = {
    id, name: s.name, field: s.field, accent: s.accent, order: s.order,
    logo: { dark: "", light: "", card: false, history: [] },
    links: { ...emptyLinks },
    stats: { members: 0, events: 0, projects: 0 },
    hero: { badges: [], title: { ...emptyL }, subtitle: { ...emptyL } },
    about: { title: { ...emptyL }, text: { ...emptyL }, compare: [], values: [], keywords: [] },
    work: { title: { ...emptyL }, intro: { ...emptyL }, steps: [], daily: [] },
    roles: { title: { ...emptyL }, intro: { ...emptyL }, items: [], join: [] },
  };
  return { ...deepMerge(blank, raw), id };
};

export const normEvent = (e: Partial<EventDoc> & { id: string }): EventDoc => ({
  slug: e.id, community: "datatech", with: [], type: { ...emptyL }, date: "", time: "", place: { ...emptyL }, title: { ...emptyL },
  summary: { ...emptyL }, body: { ...emptyL }, cover: "", gallery: [], participants: "", winners: [], registrationOpen: false, capacity: 0, published: true,
  ...e,
});
export const normPerson = (x: Partial<Person> & { id: string }): Person => ({ community: "datatech", name: "", role: { ...emptyL }, bio: { ...emptyL }, photo: "", linkedin: "", lead: false, order: 99, ...x });
export const normMentor = (x: Partial<Mentor> & { id: string }): Mentor => ({ community: "datatech", name: "", field: { ...emptyL }, photo: "", linkedin: "", order: 99, ...x });
export const normPartner = (x: Partial<Partner> & { id: string }): Partner => ({ community: "all", name: "", logo: "", url: "", desc: { ...emptyL }, order: 99, ...x });
export const normFaq = (x: Partial<Faq> & { id: string }): Faq => ({ community: "all", q: { ...emptyL }, a: { ...emptyL }, order: 99, ...x });
export const normProblem = (x: Partial<Problem> & { id: string }): Problem => ({
  title: "", description: "", affected: "", current: "", category: "", community: "all", name: "", contact: "", status: "pending", public: false, createdAt: 0, ...x,
});

const byOrder = <T extends { order: number }>(a: T, b: T) => (a.order ?? 99) - (b.order ?? 99);

export function buildContent(parts: {
  site: unknown; communities: { id: string }[]; events: { id: string }[]; team: { id: string }[]; mentors: { id: string }[];
  partners: { id: string }[]; faqs: { id: string }[]; problems: { id: string }[];
}): Content {
  const communities = {} as Record<CommunityId, Community>;
  for (const id of COMMUNITY_IDS) communities[id] = normCommunity(id, parts.communities.find((c) => c.id === id));
  return {
    site: normSite(parts.site),
    communities,
    events: parts.events.map((e) => normEvent(e as EventDoc)).filter((e) => e.published !== false).sort((a, b) => b.date.localeCompare(a.date)),
    team: parts.team.map((x) => normPerson(x as Person)).sort(byOrder),
    mentors: parts.mentors.map((x) => normMentor(x as Mentor)).sort(byOrder),
    partners: parts.partners.map((x) => normPartner(x as Partner)).sort(byOrder),
    faqs: parts.faqs.map((x) => normFaq(x as Faq)).sort(byOrder),
    problems: parts.problems.map((x) => normProblem(x as Problem)).filter((p) => p.public && p.status === "approved").sort((a, b) => b.createdAt - a.createdAt),
  };
}
