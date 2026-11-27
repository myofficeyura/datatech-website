// Saytın bütün statik məzmunu. Firebase qoşulanda tədbirlər, bloq, karyera və s.
// Firestore-dan da gələ bilər; bu fayl həm defolt məzmun, həm də çatbotun bilik bazasıdır.

export type L = { az: string; en: string };
const l = (az: string, en: string): L => ({ az, en });

export const SITE = {
  name: "DataTech",
  university: l("Bakı Mühəndislik Universiteti", "Baku Engineering University"),
  founded: "2026-11-16",
  // Boş qalan link/ünvan saytda göstərilmir.
  instagram: "https://www.instagram.com/datatech.beu/",
  linkedin: "", // yaxında
  tiktok: "https://www.tiktok.com/@datatech.beu",
  whatsapp: "https://chat.whatsapp.com/FtHWr7NQ4JNH20xzO15O2n",
  handle: "@datatech.beu",
  email: "datatech.beu@gmail.com",
};

// Rəqəmlər: Firestore-da `stats/public` sənədi varsa oradan oxunur, yoxsa bunlar göstərilir.
// 0 olan rəqəm saytda göstərilmir.
export const STATS = { members: 165, events: 1, faculties: 1, rating: 5 };

export type Member = { id: string; name: string; role: L; bio: L; photo: string; linkedin?: string };
export const TEAM: Member[] = [
  { id: "yusif", name: "Yusif Əliyev", photo: "/img/team/yusif.webp",
    role: l("İcma rəhbəri", "Community lead"),
    bio: l("Tərəfdaşlar, mentorlar, universitet rəhbərliyi və digər icmalarla əlaqə. Üzv aktivliyi alqoritmi və icmanın analitikası.",
           "Partners, mentors, university leadership and other communities. Member activity algorithm and community analytics.") },
  { id: "leman", name: "Ləman Bayramova", photo: "/img/team/leman.webp",
    role: l("Data Science və karyera mentoru", "Data Science & career mentor"),
    bio: l("CV, LinkedIn, proqramlar və elanlar. Üzvlərə 1:1 dəstək. LinkedIn səhifəsini idarə edir.",
           "CVs, LinkedIn, programs and announcements. 1:1 support for members. Runs the LinkedIn page.") },
  { id: "turqut", name: "Turqut Abbaslı", photo: "/img/team/turqut.webp",
    role: l("Yarışlar və hakatonlar", "Competitions & hackathons"),
    bio: l("Yarışlar, hackathonlar, sessiyalar, otaqlar və logistika. Daxili və xarici şəbəkələşmə.",
           "Competitions, hackathons, sessions, rooms and logistics. Internal and external networking.") },
  { id: "tariel", name: "Tariel Cəbrayılov", photo: "/img/team/tariel.webp",
    role: l("SMM və üzv cəlbi", "SMM & recruitment"),
    bio: l("TikTok və Instagram, aktiv tələbələr haqqında videolar, yeni üzvlərin cəlbi.",
           "TikTok and Instagram, videos about active students, bringing in new members.") },
  { id: "ramile", name: "Ramilə Məmmədli", photo: "/img/team/ramile.webp",
    role: l("Texnologiya və sayt", "Tech & website"),
    bio: l("Sayt, açıq dərslər və imtahanlar, yarış sualları, sənədləşmə, arxiv və planlaşdırma.",
           "Website, open lessons and exams, contest questions, documentation, archive and planning.") },
  { id: "zehra", name: "Zəhra Ağayeva", photo: "/img/team/zehra.webp",
    role: l("Ümumi təşkilatçı", "General organiser"),
    bio: l("Ümumi dəstək və yeni üzvlərin cəlbi.", "General support and recruiting new members.") },
];

export const PARTNERS = [
  { id: "innoventure", name: "Innoventure", logo: "/img/partners/innoventure.png", desc: l("İnnovasiya və startap icması", "Innovation & startup community") },
  { id: "devora", name: "Devora", logo: "", desc: l("Proqramlaşdırma icması", "Developer community") },
  { id: "shellshock", name: "ShellShock", logo: "", desc: l("Kibertəhlükəsizlik icması", "Cybersecurity community") },
];

export type EventItem = {
  slug: string; title: L; date: string; time: string; place: L; type: "event" | "workshop" | "hackathon" | "info";
  desc: L; capacity: number; registered: number; past?: boolean; rating?: number; ratingCount?: number;
  gallery?: string[]; sample?: boolean;
};
export const EVENTS: EventItem[] = [
  { slug: "info-gun", title: l("İnfo gün", "Info day"), date: "2026-11-19", time: "12:00–13:00",
    place: l("BMU", "BEU"), type: "info", capacity: 0, registered: 0, past: true, rating: 5.0,
    gallery: ["/img/gallery/infoday-speaker.webp", "/img/gallery/infoday-audience.webp", "/img/gallery/infoday-podium.webp", "/img/gallery/infoday-seated.webp",
      "/img/gallery/infoday-winners-1.webp", "/img/gallery/infoday-winners-2.webp", "/img/gallery/infoday-winners-3.webp"],
    desc: l("DataTech-in ilk açıq görüşü. 50+ tələbə iştirak etdi. Yusif Əliyev və Kənan Babazadə icmanı tanıtdı, sonra workshop keçirildi. Hər iştirakçı 5 ulduz verdi.",
            "DataTech's first open meetup. 50+ students attended. Yusif Əliyev and Kənan Babazadə introduced the community, followed by a workshop. Every attendee gave 5 stars.") },
];

export type RoadItem = { date: string; title: L; desc: L; tag: "event" | "learn" | "growth" | "milestone" };
export const ROADMAP_90: RoadItem[] = [];
export const ROADMAP_YEAR: RoadItem[] = [];

export const RESOURCES = [
  { cat: l("Başlanğıc", "Start here"), items: [
    { title: "Python for Everybody", url: "https://www.py4e.com/", note: l("Pulsuz Python kursu", "Free Python course") },
    { title: "Kaggle Learn", url: "https://www.kaggle.com/learn", note: l("Qısa praktik dərslər", "Short hands-on lessons") },
  ]},
  { cat: l("Data analizi", "Data analysis"), items: [
    { title: "pandas documentation", url: "https://pandas.pydata.org/docs/getting_started/index.html", note: l("Rəsmi başlanğıc bələdçisi", "Official getting-started guide") },
    { title: "Google Colab", url: "https://colab.research.google.com/", note: l("Brauzerdə pulsuz notebook", "Free notebooks in the browser") },
  ]},
  { cat: l("Maşın öyrənməsi", "Machine learning"), items: [
    { title: "scikit-learn tutorials", url: "https://scikit-learn.org/stable/tutorial/index.html", note: l("Klassik ML", "Classic ML") },
    { title: "fast.ai", url: "https://course.fast.ai/", note: l("Praktik dərin öyrənmə", "Practical deep learning") },
  ]},
  { cat: l("Datasetlər", "Datasets"), items: [
    { title: "Kaggle Datasets", url: "https://www.kaggle.com/datasets", note: l("Minlərlə açıq dataset", "Thousands of open datasets") },
    { title: "UCI ML Repository", url: "https://archive.ics.uci.edu/", note: l("Klassik datasetlər", "Classic datasets") },
  ]},
];

export const COMPETITIONS: { title: L; date: string; kind: L; url: string; status: "open" | "soon" }[] = [];

export const POSTS: { slug: string; date: string; author: string; title: L; excerpt: L; body: L }[] = [];

export type Mentor = { id: string; name: string; photo: string; title: L; topics: L; linkedin?: string; slots: string[] };
export const MENTORS: Mentor[] = [
  { id: "ulvi", name: "Ülvi Həsənov", photo: "/img/mentors/ulvi.webp",
    title: l("Senior BI analitik, Bakı Metropoliteni QSC", "Senior BI analyst, Baku Metro CJSC"),
    topics: l("Biznes analitikası (BI)", "Business intelligence (BI)"),
    linkedin: "https://www.linkedin.com/in/hasanov-ulvi", slots: [] },
  { id: "sevinc", name: "Sevinc Rəhimova", photo: "/img/mentors/sevinc.webp",
    title: l("Data analitik", "Data analyst"),
    topics: l("Data analitika, maşın öyrənməsi, AI etikası", "Data analytics, machine learning, AI ethics"),
    linkedin: "https://www.linkedin.com/in/sevinjrahimova", slots: [] },
  { id: "sitare", name: "Sitarə Ağayeva", photo: "/img/mentors/sitare.webp",
    title: l("GenAI, Data Science və MRM mütəxəssisi · GDG Baku təşkilatçısı", "GenAI, Data Science & MRM specialist · GDG Baku organiser"),
    topics: l("Model validasiyası və audit, GenAI, Data Science", "Model validation and audit, GenAI, Data Science"),
    linkedin: "https://www.linkedin.com/in/sitar%C9%99-a%C4%9Fayeva-rai%E2%84%A2-7b2212162", slots: [] },
];

export const BADGES = [
  { id: "first-step", name: l("İlk addım", "First step"), how: l("Qeydiyyatdan keç", "Sign up"), icon: "flag" },
  { id: "info-day", name: l("İnfo gün", "Info day"), how: l("İnfo gündə iştirak et", "Attend the info day"), icon: "info" },
  { id: "inviter", name: l("Dəvətçi", "Inviter"), how: l("2 dost dəvət et", "Invite 2 friends"), icon: "people" },
  { id: "explorer", name: l("Data Explorer", "Data Explorer"), how: l("1500 xal topla", "Reach 1500 points"), icon: "chart" },
  { id: "hacker", name: l("Hackathon", "Hackathon"), how: l("Hackathonda iştirak et", "Join a hackathon"), icon: "bolt" },
  { id: "quiz", name: l("Quiz ustası", "Quiz master"), how: l("4 həftə quizi tam cavabla", "Ace the quiz 4 weeks in a row"), icon: "spark" },
  { id: "ambassador", name: l("Həftənin ambassadoru", "Ambassador of the week"), how: l("Həftədə ən çox üzv gətir", "Bring the most members in a week"), icon: "trophy" },
  { id: "builder", name: l("Qurucu", "Builder"), how: l("Demo Day-də layihə təqdim et", "Present a project at Demo Day"), icon: "code" },
];

export const FAQ: { q: L; a: L }[] = [];

export const QUIZ: { week: string; questions: { q: L; options: string[]; answer: number }[] } = { week: "", questions: [] };

// Xal qaydaları. Yusifin alqoritmi burada tənzimlənir.
export const POINTS = {
  signup: 100, eventAttend: 200, eventRegister: 50, feedback: 40, invite: 50,
  quizCorrect: 20, groupMessageWeek: 10, projectSubmit: 300, hackathon: 300,
};

// Qeydiyyat formasındakı fakültələr. Boşdursa, sahə sərbəst mətn olur.
export const FACULTIES: string[] = ["İKT", "Yeni korpus", "İBF", "Dillər"];

export const NAV = {
  main: [
    { href: "/", key: "home", icon: "home" },
    { href: "/haqqimizda", key: "about", icon: "info" },
    { href: "/tedbirler", key: "events", icon: "cal" },
    { href: "/komanda", key: "team", icon: "people" },
    { href: "/mentorlar", key: "mentors", icon: "user" },
    { href: "/resurslar", key: "resources", icon: "book" },
    { href: "/reytinq", key: "rating", icon: "trophy" },
    { href: "/elaqe", key: "contact", icon: "mail" },
  ],
  // "Daha çox" altında, defolt olaraq bağlı. Məzmunu hələ olmayan səhifələr
  // (yol xəritəsi, yarışlar, quiz, blog, karyera, FAQ və s.) menyuda gizlidir,
  // amma ünvanları işləyir. Məzmun gələndə bura əlavə et.
  more: [
    { href: "/layiheler", key: "projects", icon: "code" },
    { href: "/xeberler", key: "news", icon: "news" },
    { href: "/qalereya", key: "gallery", icon: "image" },
    { href: "/terefdaslar", key: "partners", icon: "hand" },
    { href: "/nisanlar", key: "badges", icon: "star" },
    { href: "/sertifikat", key: "certificate", icon: "shield" },
    { href: "/rey", key: "feedback", icon: "pen" },
  ],
} as const;
