export type Lang = "az" | "en";
export type L = { az: string; en: string };

export const COMMUNITY_IDS = ["devora", "shellshock", "datatech", "innotech"] as const;
export type CommunityId = (typeof COMMUNITY_IDS)[number];
/** "all" = ortaq (bütün icmalar). */
export type Scope = CommunityId | "all";

export const isCommunityId = (v: unknown): v is CommunityId =>
  typeof v === "string" && (COMMUNITY_IDS as readonly string[]).includes(v);

export type LogoVersion = { url: string; at: number; variant: "dark" | "light" };
/** dark: qaranlıq fonda göstərilən loqo, light: işıqlı fonda. Boşdursa baş hərflər göstərilir. */
export type LogoSet = { dark: string; light: string; card: boolean; history: LogoVersion[] };

export type Links = {
  whatsapp: string;
  instagram: string;
  tiktok: string;
  linkedin: string;
  telegram: string;
  email: string;
};

export type Item = { title: L; text: L };
export type Step = { title: L; text: L; result: L };
export type Hero = { badges: L[]; title: L; subtitle: L };

export type Community = {
  id: CommunityId;
  name: string;
  field: L;
  accent: string;
  order: number;
  logo: LogoSet;
  links: Links;
  stats: { members: number; events: number; projects: number };
  hero: Hero;
  about: { title: L; text: L; compare: { old: L; now: L }[]; values: Item[]; keywords: string[] };
  work: { title: L; intro: L; steps: Step[]; daily: Item[] };
  roles: { title: L; intro: L; items: Item[]; join: Item[] };
};

export type SiteSettings = {
  name: L;
  accent: string;
  logo: LogoSet;
  favicon: string;
  links: Links;
  /** 0 olan rəqəm saytda göstərilmir. members 0-dırsa icmaların cəmi götürülür. */
  stats: { members: number; events: number; partners: number };
  hero: Hero;
  about: { title: L; text: L; keywords: string[] };
};

export type EventDoc = {
  id: string;
  slug: string;
  community: CommunityId;
  with: CommunityId[];
  type: L;
  date: string; // YYYY-MM-DD
  time: string;
  place: L;
  title: L;
  summary: L;
  body: L;
  cover: string;
  gallery: string[];
  participants: string;
  winners: string[];
  registrationOpen: boolean;
  capacity: number;
  published: boolean;
};

export type Person = {
  id: string;
  community: CommunityId;
  name: string;
  role: L;
  bio: L;
  photo: string;
  linkedin: string;
  lead: boolean;
  order: number;
};

export type Mentor = {
  id: string;
  community: CommunityId;
  name: string;
  field: L;
  photo: string;
  linkedin: string;
  order: number;
};

export type Partner = {
  id: string;
  community: Scope;
  name: string;
  logo: string;
  url: string;
  desc: L;
  order: number;
};

export type Faq = { id: string; community: Scope; q: L; a: L; order: number };

export type ProblemStatus = "pending" | "approved" | "rejected";
export type Problem = {
  id: string;
  title: string;
  description: string;
  affected: string;
  current: string;
  category: string;
  community: Scope;
  name: string;
  contact: string;
  status: ProblemStatus;
  public: boolean;
  createdAt: number;
};

export type Question = {
  id: string;
  kind: "question" | "contact";
  name: string;
  contact: string;
  question: string;
  category: string;
  community: Scope;
  answered: boolean;
  createdAt: number;
};

export type CollabType = "community" | "sponsor" | "mentor" | "company";
export type Collab = {
  id: string;
  type: CollabType;
  name: string;
  org: string;
  contact: string;
  message: string;
  community: Scope;
  answered: boolean;
  createdAt: number;
};

export type Registration = {
  id: string;
  eventId: string;
  eventSlug: string;
  name: string;
  contact: string;
  group: string;
  note: string;
  createdAt: number;
};

export type AdminRole = { email: string; role: "super" | "community"; community?: CommunityId };

export type Content = {
  site: SiteSettings;
  communities: Record<CommunityId, Community>;
  events: EventDoc[];
  team: Person[];
  mentors: Mentor[];
  partners: Partner[];
  faqs: Faq[];
  problems: Problem[];
};

/** Firestore kolleksiyaları (prefikssiz adlar). */
export const COLS = {
  site: "site",
  communities: "communities",
  events: "events",
  team: "team",
  mentors: "mentors",
  partners: "partners",
  faqs: "faqs",
  problems: "problems",
  questions: "questions",
  collabs: "collabs",
  registrations: "registrations",
  admins: "admins",
  media: "media",
} as const;
export type ColName = (typeof COLS)[keyof typeof COLS];
