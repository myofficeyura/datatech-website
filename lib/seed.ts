// İlk (defolt) məzmun. Admin paneldə "Defolt məzmunu yüklə" düyməsi bunu Firestore-a yazır.
// Qayda: saxta rəqəm, saxta üzv, saxta rəy, saxta tədbir yoxdur. Məlumat yoxdursa sahə boş qalır
// və saytda bölmə "Tezliklə" göstərir və ya gizlənir. Heç bir icma üçün motto uydurulmayıb.
//
// Mənbələr:
// - DataTech: icmanın öz saytı və komanda məlumatları (165 üzv, 1 tədbir, əlaqə linkləri).
// - InnoTech: innotech-community.vercel.app saytındakı açıq məlumatlar (komanda, mentorlar, FAQ).
// - DevOra və ShellShock: InnoTech saytındakı tərəfdaş təsviri və rəhbər adları.

import type { Community, CommunityId, Content, EventDoc, Faq, Links, LogoSet, Mentor, Partner, Person, Problem, SiteSettings, L } from "./types";

const l = (az: string, en: string): L => ({ az, en });
const E = l("", "");
const noLinks: Links = { whatsapp: "", instagram: "", tiktok: "", linkedin: "", telegram: "", email: "" };
const logo = (url: string, card = true): LogoSet => ({ dark: url, light: url, card, history: [] });

const emptyCommunity = (id: CommunityId, name: string, field: L, accent: string, order: number): Community => ({
  id, name, field, accent, order,
  logo: logo("", false),
  links: { ...noLinks },
  stats: { members: 0, events: 0, projects: 0 },
  hero: { badges: [], title: l(`${name}.`, `${name}.`), subtitle: E },
  about: { title: E, text: E, compare: [], values: [], keywords: [] },
  work: { title: E, intro: E, steps: [], daily: [] },
  roles: { title: E, intro: E, items: [], join: [] },
});

// ───────────────────────── DevOra ─────────────────────────
const devora: Community = {
  ...emptyCommunity("devora", "DevOra", l("Proqramlaşdırma və open source icması", "Programming & open source community"), "#14B8A6", 1),
  hero: {
    badges: [l("Proqramlaşdırma", "Programming"), l("Open source", "Open source"), l("BMU", "BEU")],
    title: l("DevOra.\nProqramlaşdırma və open source icması.\nBakı Mühəndislik Universiteti.", "DevOra.\nA programming & open source community.\nBaku Engineering University."),
    subtitle: E,
  },
  about: {
    title: l("DevOra haqqında", "About DevOra"),
    text: l(
      "Proqramlaşdırma və texnologiya ilə maraqlanan tələbələri bir araya gətirən developer icması. Praktiki layihələr, kod təcrübəsi və texniki inkişafa fokuslanır.",
      "A developer community that brings together students interested in programming and technology. It focuses on practical projects, coding experience and technical growth.",
    ),
    compare: [], values: [], keywords: [],
  },
};

// ───────────────────────── ShellShock ─────────────────────────
const shellshock: Community = {
  ...emptyCommunity("shellshock", "ShellShock", l("Kibertəhlükəsizlik icması", "Cybersecurity community"), "#FF3B5C", 2),
  hero: {
    badges: [l("Kibertəhlükəsizlik", "Cybersecurity"), l("CTF", "CTF"), l("BMU", "BEU")],
    title: l("ShellShock.\nKibertəhlükəsizlik icması.\nBakı Mühəndislik Universiteti.", "ShellShock.\nA cybersecurity community.\nBaku Engineering University."),
    subtitle: E,
  },
  about: {
    title: l("ShellShock haqqında", "About ShellShock"),
    text: l(
      "Kibertəhlükəsizliklə maraqlanan tələbələrin icması. Etik hakerlik, şəbəkə və tətbiq təhlükəsizliyi, CTF yarışları və praktiki təhlükəsizlik bacarıqlarına fokuslanır.",
      "A community of students interested in cybersecurity. It focuses on ethical hacking, network and application security, CTF competitions and hands-on security skills.",
    ),
    compare: [], values: [], keywords: [],
  },
};

// ───────────────────────── DataTech ─────────────────────────
const datatech: Community = {
  ...emptyCommunity("datatech", "DataTech", l("Süni intellekt və Data Science icması", "AI & Data Science community"), "#2456EE", 3),
  logo: logo("/logos/datatech-logo.webp", true),
  links: {
    ...noLinks,
    whatsapp: "https://chat.whatsapp.com/FtHWr7NQ4JNH20xzO15O2n",
    instagram: "https://www.instagram.com/datatech.beu/",
    tiktok: "https://www.tiktok.com/@datatech.beu",
    email: "datatech.beu@gmail.com",
  },
  stats: { members: 165, events: 1, projects: 0 },
  hero: {
    badges: [l("Təlim", "Learning"), l("Təcrübə və yarış", "Practice & competitions"), l("Layihə və karyera", "Projects & careers")],
    title: l("DataTech.\nSüni intellekt və Data Science icması.\nBakı Mühəndislik Universiteti.", "DataTech.\nAn AI & Data Science community.\nBaku Engineering University."),
    subtitle: l(
      "16 noyabr 2026-da qurulub. Data və süni intellektlə maraqlanan BMU tələbələri üçün workshoplar, yarışlar, komanda layihələri və karyera dəstəyi.",
      "Founded on 16 November 2026. Workshops, competitions, team projects and career support for BEU students interested in data and AI.",
    ),
  },
  about: {
    title: l("DataTech nədir?", "What is DataTech?"),
    text: l(
      "Bakı Mühəndislik Universitetinin süni intellekt və data elmi tələbə icması. Nəzəriyyədən çox real layihəyə, tək işləməkdən çox komandada qurmağa üstünlük veririk.",
      "The AI and data science student community of Baku Engineering University. We value real projects over theory, and building in teams over working alone.",
    ),
    compare: [
      { old: l("Nəzəri mühazirələr", "Theory lectures"), now: l("Praktik workshoplar: Python, SQL, data analizi", "Hands-on workshops: Python, SQL, data analysis") },
      { old: l("Tək öyrənmək", "Learning alone"), now: l("Komanda layihələri və mini-hackathonlar", "Team projects and mini-hackathons") },
      { old: l("İştirak üçün iştirak", "Showing up for the sake of it"), now: l("Aktivliyə görə reytinq və aylıq mükafat", "Activity-based ranking and a monthly reward") },
      { old: l("Tədbir bitir, əlaqə qırılır", "The event ends, the contact is lost"), now: l("Mentorluq və karyera dəstəyi", "Mentoring and career support") },
    ],
    values: [
      { title: l("Təlim", "Learning"), text: l("Python, pandas, vizualizasiya və ML əsasları. Başlanğıc səviyyədən.", "Python, pandas, visualisation and ML basics. Beginner friendly.") },
      { title: l("Təcrübə və yarış", "Practice & competitions"), text: l("Daxili mini-hackathonlar, tərəfdaşlarla yarışlar və Kaggle komandaları.", "Internal mini-hackathons, contests with partners and Kaggle teams.") },
      { title: l("Layihə və karyera", "Projects & careers"), text: l("Real data layihələri, ictimai təqdimat, CV və LinkedIn üçün 1:1 dəstək.", "Real data projects, public demos, and 1:1 help with CVs and LinkedIn.") },
    ],
    keywords: ["Python", "pandas", "SQL", "Machine Learning", "Data Analysis", "Kaggle", "AI"],
  },
  roles: {
    title: E, intro: E, items: [],
    join: [
      { title: l("WhatsApp qrupuna qoşul", "Join the WhatsApp group"), text: l("Elanları və tədbirləri ilk sən görürsən.", "See announcements and events first.") },
      { title: l("Workshoplara gəl", "Come to workshops"), text: l("Başlanğıc səviyyədən praktik dərslər.", "Hands-on sessions from beginner level.") },
      { title: l("Komandada işlə", "Work in a team"), text: l("Layihələrdə və yarışlarda iştirak et.", "Take part in projects and competitions.") },
    ],
  },
};

// ───────────────────────── InnoTech ─────────────────────────
const innotech: Community = {
  ...emptyCommunity("innotech", "InnoTech", l("İnnovativ sahibkarlıq və startap icması", "Innovative entrepreneurship & startup community"), "#8B5CF6", 4),
  logo: logo("/logos/innotech-logo.webp", true),
  links: { ...noLinks, whatsapp: "https://chat.whatsapp.com/H5tc4lb5mNFB6knq6rb3O3" },
  hero: {
    badges: [l("Venture studio modeli", "Venture studio model"), l("BMU Texnoparkına yol", "Path to BEU Technopark"), l("Developer · Dizayner · Biznes", "Developer · Designer · Business")],
    title: l("Problemləri tapırıq.\nKomandalar qururuq.\nStartaplar yaradırıq.", "Find the problem.\nBuild the team.\nLaunch the startup."),
    subtitle: l(
      "Tələbə venture studiyası: bazar problemlərini tapır, data ilə doğrulayır və onları real startaplara çeviririk.",
      "A student venture studio: we find real market problems, validate them with data and turn them into real startups.",
    ),
  },
  about: {
    title: l("Sıradan nəzəri seminarlar keçən klub deyilik.", "We're not another club of theory seminars."),
    text: l(
      "Bakı Mühəndislik Universitetində fəaliyyət göstəririk. Məqsədimiz nəzəriyyədən real məhsula keçməkdir. Bazarın real problemini götürür, onu məhsula çevirir və layihələri BMU Texnoparkına və bazara çıxarırıq.",
      "We are based at Baku Engineering University. Our goal is to move from theory to real products: we take a real market problem, turn it into a product and take projects to the BEU Technopark and the market.",
    ),
    compare: [
      { old: l("Nəzəri seminarlar", "Theory seminars"), now: l("Real problem və Mini-PRD", "Real problems and a Mini-PRD") },
      { old: l("Təsadüfi qruplar", "Random groups"), now: l("Çoxistiqamətli Product Squads", "Cross-functional Product Squads") },
      { old: l("Fikir olaraq qalır", "Ideas stay ideas"), now: l("Data ilə doğrulanır", "Validated with data") },
      { old: l("Tədbir bitir, ideya sönür", "The event ends, the idea fades"), now: l("Texnopark və bazara yol", "A path to the Technopark and the market") },
    ],
    values: [
      { title: l("Problemdən başla", "Start with the problem"), text: l("İdeyadan yox, bazarda mövcud olan real problemdən başlayırıq.", "We start from a real problem in the market, not from an idea.") },
      { title: l("Data ilə doğrula", "Validate with data"), text: l("Problemin həqiqi olduğunu fərziyyə ilə yox, data ilə yoxlayırıq.", "We check that a problem is real with data, not assumptions.") },
      { title: l("Komandayla qur", "Build as a team"), text: l("Developer, dizayner və biznes tələbələri bir masada məhsul qurur.", "Developers, designers and business students build the product at one table.") },
    ],
    keywords: ["Problem Bank", "Mini-PRD", "Product Squads", "Data", "Bazar"],
  },
  work: {
    title: l("Orkestrator modeli", "The Orchestrator model"),
    intro: l(
      "Venture studiya kimi işləyirik: problemi tapır, yoxlayır, tapşırığa çevirir, komanda qurur və bazara çıxarırıq.",
      "We work like a venture studio: we find a problem, test it, turn it into a brief, build a team and take it to market.",
    ),
    steps: [
      { title: l("Problem Bank", "Problem Bank"), text: l("Tələbələrin və bazarın real problemlərini toplayır, bir bankda saxlayırıq.", "We collect real problems from students and the market and keep them in one bank."), result: l("problem siyahısı", "a list of problems") },
      { title: l("Data/AI doğrulama", "Data/AI validation"), text: l("Hər problemi data və süni intellektlə yoxlayırıq: həqiqətən mövcuddurmu, kimə aiddir?", "We test every problem with data and AI: does it really exist, and who does it affect?"), result: l("doğrulanmış problem", "a validated problem") },
      { title: l("Mini-PRD", "Mini-PRD"), text: l("Doğrulanmış problemi qısa texniki tapşırığa çeviririk: nə qurulur, kim üçün, necə ölçülür.", "We turn a validated problem into a short brief: what gets built, for whom and how success is measured."), result: l("texniki tapşırıq", "a product brief") },
      { title: l("Product Squads", "Product Squads"), text: l("Mini-PRD ətrafında developer, dizayner və biznes tələbələrindən qapalı komanda qururuq.", "Around each Mini-PRD we form a closed team of developer, designer and business students."), result: l("işləyən komanda", "a working team") },
      { title: l("Texnopark və bazar", "Technopark and market"), text: l("Hazır layihələri BMU Texnoparkına və real bazara çıxarırıq.", "We take finished projects to the BEU Technopark and to the real market."), result: l("real məhsul", "a real product") },
    ],
    daily: [
      { title: l("Problem Bank-ın formalaşdırılması", "Building the Problem Bank"), text: l("Problemləri toplayır, qruplaşdırır və prioritetləşdiririk.", "We collect, group and prioritise problems.") },
      { title: l("Bazar analizi və Mini-PRD", "Market research and Mini-PRDs"), text: l("Bazarı araşdırır, problemi texniki tapşırığa salırıq.", "We research the market and turn problems into product briefs.") },
      { title: l("Product Squads-ın qurulması", "Forming Product Squads"), text: l("Üzvləri bacarıqlarına görə komandalara yerləşdiririk.", "We place members in teams based on their skills.") },
      { title: l("Workshoplar, pitching günləri, tədbirlər", "Workshops, pitch days and events"), text: l("Komandaların ideyasını sınaqdan keçirən formatlar təşkil edirik.", "We run formats that put team ideas to the test.") },
      { title: l("Ekosistem, mentor və sponsorlar", "Ecosystem, mentors and sponsors"), text: l("Startap ekosistemi, mentorlar və sponsorlarla əlaqə qururuq.", "We connect with the startup ecosystem, mentors and sponsors.") },
    ],
  },
  roles: {
    title: l("Üç rol, bir komanda.", "Three roles, one team."),
    intro: l("Hər squad müxtəlif ixtisaslı tələbələrdən ibarət qapalı komandadır və bir Mini-PRD üzərində işləyir.", "Each squad is a closed team of students from different fields working on a single Mini-PRD."),
    items: [
      { title: l("Developer", "Developer"), text: l("Məhsulu qurur: kod, arxitektura və süni intellekt inteqrasiyası.", "Builds the product: code, architecture and AI integration.") },
      { title: l("Dizayner", "Designer"), text: l("İstifadəçi təcrübəsini və interfeysi formalaşdırır.", "Shapes the user experience and the interface.") },
      { title: l("Biznes", "Business"), text: l("Bazarı, istifadəçini və məhsulun bazara çıxış yolunu müəyyən edir.", "Defines the market, the user and the go-to-market path.") },
    ],
    join: [
      { title: l("WhatsApp qrupuna qoşul", "Join the WhatsApp group"), text: l("İcmanın qrupuna qoşulur, elanları izləyirsən.", "Join the community group and follow announcements.") },
      { title: l("Komandaya uyğunlaşdırma", "Get matched to a team"), text: l("Bacarıqlarına uyğun squad və Mini-PRD seçilir.", "We pick a squad and a Mini-PRD that fit your skills.") },
      { title: l("Squad-da işə başla", "Start in your squad"), text: l("Komandanla real məhsul üzərində işləyirsən.", "You work on a real product with your team.") },
    ],
  },
};

// ───────────────────────── Ortaq sayt ─────────────────────────
export const SEED_SITE: SiteSettings = {
  name: l("BMU İcmaları", "BEU Communities"),
  accent: "#6366F1",
  logo: logo("", false),
  favicon: "",
  links: { ...noLinks },
  stats: { members: 0, events: 0, partners: 0 },
  hero: {
    badges: [l("4 tələbə icması", "4 student communities"), l("Birgə tədbirlər", "Joint events"), l("Ortaq Problem Bank", "Shared Problem Bank")],
    title: l("Dörd icma.\nBir universitet.\nBir platforma.", "Four communities.\nOne university.\nOne platform."),
    subtitle: l(
      "Bakı Mühəndislik Universitetinin proqramlaşdırma, kibertəhlükəsizlik, süni intellekt və sahibkarlıq icmaları bir yerdə: tədbirlər, komandalar və problemlər.",
      "Baku Engineering University's programming, cybersecurity, AI and entrepreneurship communities in one place: events, teams and problems.",
    ),
  },
  about: {
    title: l("Dörd sahə, bir ekosistem", "Four fields, one ecosystem"),
    text: l(
      "DevOra, ShellShock, DataTech və InnoTech BMU-da fərqli sahələrdə fəaliyyət göstərir. Bu sayt dörd icmanın tədbirlərini, komandalarını və birgə Problem Bank-ını bir yerdə toplayır ki, tələbə öz yerini asan tapsın.",
      "DevOra, ShellShock, DataTech and InnoTech work in different fields at BEU. This site brings together the events, teams and shared Problem Bank of all four, so every student can easily find their place.",
    ),
    keywords: ["DevOra", "ShellShock", "DataTech", "InnoTech", "Open source", "CTF", "AI", "Data Science", "Startup"],
  },
};

// ───────────────────────── Tədbirlər ─────────────────────────
const EVENTS: EventDoc[] = [
  {
    id: "startap-ai-2026-11-19",
    slug: "startap-ai-2026-11-19",
    community: "innotech",
    with: ["datatech"],
    type: l("Workshop", "Workshop"),
    date: "2026-11-19",
    time: "12:00–13:00",
    place: l("Bakı Mühəndislik Universiteti, Yeni bina, Akt zalı", "Baku Engineering University, New building, Assembly hall"),
    title: l("Startap & AI: InnoTech × DataTech", "Startup & AI: InnoTech × DataTech"),
    summary: l(
      "InnoTech və DataTech-in ilk birgə tədbiri: icmaların təqdimatı, canlı Mini-PRD workshop-u və qaliblərin mükafatlandırılması.",
      "The first joint event of InnoTech and DataTech: community introductions, a live Mini-PRD workshop and awards for the winning teams.",
    ),
    body: l(
      "12:00–12:20 — Açılış. InnoTech × DataTech əməkdaşlığının və Orkestrator modelinin təqdimatı. Çıxış edənlər: Kənan Babazadə (InnoTech) və Yusif Əliyev (DataTech).\n12:20–12:40 — Canlı Startap & AI workshop-u. Mini-PRD simulyasiyası: komandalara bölünmə, problem seçimi, 4 sual və Elevator Pitch.\n12:40–13:00 — Mükafatlandırma və networking. Qalib komandaların mükafatlandırılması və sərbəst networking.",
      "12:00–12:20 — Opening. Introducing the InnoTech × DataTech partnership and the Orchestrator model. Speakers: Kənan Babazadə (InnoTech) and Yusif Əliyev (DataTech).\n12:20–12:40 — Live Startup & AI workshop. A Mini-PRD simulation: forming teams, choosing a problem, 4 questions and an elevator pitch.\n12:40–13:00 — Awards and networking. Prizes for the winning teams and open networking.",
    ),
    cover: "/img/events/infoday-audience.webp",
    gallery: [
      "/img/events/infoday-speaker.webp",
      "/img/events/infoday-audience.webp",
      "/img/events/infoday-podium.webp",
      "/img/events/infoday-seated.webp",
      "/img/events/infoday-winners-1.webp",
      "/img/events/infoday-winners-2.webp",
      "/img/events/infoday-winners-3.webp",
    ],
    participants: "50+",
    winners: ["BlueBerry", "CYBERNOVA", "FlowMakers"],
    registrationOpen: false,
    capacity: 0,
    published: true,
  },
];

// ───────────────────────── Komandalar ─────────────────────────
const p = (community: CommunityId, order: number, id: string, name: string, role: L, bio: L, photo = "", lead = false): Person =>
  ({ id: `${community}-${id}`, community, name, role, bio, photo, linkedin: "", lead, order });

const TEAM: Person[] = [
  // DataTech
  p("datatech", 1, "yusif", "Yusif Əliyev", l("Lider", "Leader"),
    l("Tərəfdaşlar, mentorlar, universitet rəhbərliyi və digər icmalarla əlaqə. Üzv aktivliyi alqoritmi və icmanın analitikası.", "Partners, mentors, university leadership and other communities. Member activity algorithm and community analytics."),
    "/img/team/datatech/yusif.webp", true),
  p("datatech", 2, "leman", "Ləman Bayramova", l("Data Science və karyera mentoru", "Data Science & career mentor"),
    l("CV, LinkedIn, proqramlar və elanlar. Üzvlərə 1:1 dəstək. LinkedIn səhifəsini idarə edir.", "CVs, LinkedIn, programs and announcements. 1:1 support for members. Runs the LinkedIn page."),
    "/img/team/datatech/leman.webp"),
  p("datatech", 3, "turqut", "Turqut Abbaslı", l("Yarışlar və logistika", "Competitions & logistics"),
    l("Yarışlar, hackathonlar, sessiyalar, otaqlar və logistika. Daxili və xarici şəbəkələşmə.", "Competitions, hackathons, sessions, rooms and logistics. Internal and external networking."),
    "/img/team/datatech/turqut.webp"),
  p("datatech", 4, "tariel", "Tariel Cəbrayılov", l("SMM və üzv cəlbi", "SMM & recruitment"),
    l("TikTok və Instagram, aktiv tələbələr haqqında videolar, yeni üzvlərin cəlbi.", "TikTok and Instagram, videos about active students, bringing in new members."),
    "/img/team/datatech/tariel.webp"),
  p("datatech", 5, "ramile", "Ramilə Məmmədli", l("Texnologiya və planlaşdırma", "Tech & planning"),
    l("Sayt, açıq dərslər və imtahanlar, yarış sualları, sənədləşmə, arxiv və planlaşdırma.", "Website, open lessons and exams, contest questions, documentation, archive and planning."),
    "/img/team/datatech/ramile.webp"),
  p("datatech", 6, "zehra", "Zəhra Ağayeva", l("Dəstək və üzv cəlbi", "Support & recruitment"),
    l("Ümumi dəstək və yeni üzvlərin cəlbi.", "General support and recruiting new members."),
    "/img/team/datatech/zehra.webp"),
  // InnoTech
  p("innotech", 1, "kenan", "Kənan Babazadə", l("Sədr / İcma Rəhbəri", "Founder & Community Lead"),
    l("İcmanın strategiyasını müəyyən edir, universitet rəhbərliyi və BMU Texnoparkı ilə əlaqələri qurur.", "Sets the community's strategy and builds relations with the university leadership and the BEU Technopark."), "", true),
  p("innotech", 2, "nihad", "Nihad Eminov", l("Xarici Əlaqələr və Sponsorluq Meneceri", "External Relations & Partnerships Manager"),
    l("Startap ekosistemi (SABAH.HUB, İnnovasiya Agentliyi və s.), mentorlar və sponsorlarla əlaqələri idarə edir.", "Manages relations with the startup ecosystem (SABAH.HUB, the Innovation Agency and others), mentors and sponsors.")),
  p("innotech", 3, "sebine", "Səbinə Allahverdili", l("Əməliyyat və İnsan Resursları Meneceri", "Operations & HR Manager"),
    l("Üzv qəbulunu, komanda əməliyyatlarını və Product Squads-ın formalaşdırılmasını idarə edir.", "Runs member intake, team operations and the forming of Product Squads.")),
  p("innotech", 4, "qismet", "Qismət Məsimov", l("Texniki İşlər və İnnovativ Sahibkarlıq Koordinatoru", "Technical & Innovative Entrepreneurship Coordinator"),
    l("Layihələrin texniki tərəfini və innovativ sahibkarlıq təşəbbüslərini koordinasiya edir.", "Coordinates the technical side of projects and innovative entrepreneurship initiatives.")),
  p("innotech", 5, "vuqar", "Vüqar Abdullayev", l("Məhsul və Bazar Analitikası Koordinatoru", "Product & Market Analytics Coordinator"),
    l("İdeyaların bazar analizini, məhsul araşdırmasını və Mini-PRD hazırlanmasını koordinasiya edir.", "Coordinates market analysis of ideas, product research and Mini-PRD writing.")),
  p("innotech", 6, "cevahir", "Cəvahir Hüseynova", l("PR, Kommunikasiya və Tədbirlər Meneceri", "PR, Communications & Events Manager"),
    l("Sosial media, brendinq və kommunikasiyanı, tədbirlərin və workshopların təşkilini idarə edir.", "Runs social media, branding and communications, and organises events and workshops.")),
  // DevOra, ShellShock (rəhbərlər)
  p("devora", 1, "xedice", "Xədicə Əhmədova", l("Rəhbər", "Lead"), E, "", true),
  p("shellshock", 1, "hormuz", "Hörmüz Qurbanov", l("Rəhbər", "Lead"), E, "", true),
];

const MENTORS: Mentor[] = [
  { id: "innotech-revan", community: "innotech", name: "Rəvan Quliyev", field: l("Mentor", "Mentor"), photo: "", linkedin: "", order: 1 },
  { id: "innotech-ilyas", community: "innotech", name: "İlyas Ayageyev", field: l("Mentor", "Mentor"), photo: "", linkedin: "", order: 2 },
];

const PARTNERS: Partner[] = [];

const f = (community: Faq["community"], order: number, q: L, a: L): Faq => ({ id: `${community}-${order}`, community, q, a, order });
const FAQS: Faq[] = [
  f("all", 1, l("Bu sayt nədir?", "What is this site?"),
    l("Bakı Mühəndislik Universitetinin dörd tələbə icmasının (DevOra, ShellShock, DataTech, InnoTech) ortaq saytıdır. Hər icmanın öz səhifəsi, tədbirləri və komandası buradadır.",
      "The shared site of four student communities at Baku Engineering University (DevOra, ShellShock, DataTech, InnoTech). Each community's page, events and team are here.")),
  f("all", 2, l("Bir neçə icmaya qoşula bilərəmmi?", "Can I join more than one community?"),
    l("Bəli. İcmalar bir-birini tamamlayır və birgə tədbirlər keçirir.", "Yes. The communities complement each other and run joint events.")),
  f("all", 3, l("Problem Bank-a nə göndərə bilərəm?", "What can I send to the Problem Bank?"),
    l("Gündəlik həyatda, universitetdə və ya şəhərdə qarşılaşdığın real problemi. Problemi hansı icmaya (və ya hamısına) aid olduğunu seçə bilərsən.",
      "A real problem you face in daily life, at university or in the city. You can choose which community (or all of them) it is for.")),
  f("innotech", 1, l("InnoTech nədir?", "What is InnoTech?"),
    l("BMU-nun innovativ sahibkarlıq icması. Real bazar problemlərini tapır, data ilə doğrulayır və tələbə komandaları ilə startapa çeviririk.", "BEU's innovative entrepreneurship community. We find real market problems, validate them with data and turn them into startups with student teams.")),
  f("innotech", 2, l("Kimlər qoşula bilər?", "Who can join?"),
    l("BMU tələbələri: developer, dizayner və biznes istiqamətli tələbələr.", "BEU students: developers, designers and business-minded students.")),
  f("innotech", 3, l("Proqramlaşdırma bilməliyəmmi?", "Do I need to know how to code?"),
    l("Xeyr. Product Squads-da developer, dizayner və biznes rolları birlikdə işləyir.", "No. In Product Squads, developer, designer and business roles work together.")),
  f("innotech", 4, l("Product Squad nədir?", "What is a Product Squad?"),
    l("Bir problem üzərində məhsul quran, müxtəlif ixtisaslı tələbələrdən ibarət qapalı komanda.", "A closed team of students from different fields building a product around one problem.")),
  f("innotech", 5, l("Mini-PRD nədir?", "What is a Mini-PRD?"),
    l("Problemin və həllin qısa texniki tapşırıq formatında yazılmış təsviri. Komanda nəyi quracağını bundan bilir.", "A short brief describing the problem and the solution. It tells the team what to build.")),
  f("innotech", 6, l("DataTech ilə əlaqəniz nədir?", "How do you work with DataTech?"),
    l("DataTech ilə birlikdə problemləri data və süni intellektlə doğrulayırıq.", "Together with DataTech we validate problems with data and AI.")),
  f("innotech", 7, l("Necə qoşula bilərəm?", "How can I join?"),
    l("\"Qoşul\" düyməsi ilə WhatsApp qrupumuza daxil ol.", "Use the \"Join\" button to enter our WhatsApp group.")),
];

const pr = (id: string, title: string, category: string): Problem =>
  ({ id, title, description: "", affected: "", current: "", category, community: "innotech", name: "", contact: "", status: "approved", public: true, createdAt: Date.UTC(2026, 10, 20) });
const PROBLEMS: Problem[] = [
  pr("innotech-p1", "İmtahan vaxtı mühazirə qeydlərini və keçmiş sualları tapmaq çətinliyi", "education"),
  pr("innotech-p2", "Bakı–Xırdalan yolunda vaxt və nəqliyyat xərci", "transport"),
  pr("innotech-p3", "1–2-ci kurs tələbələrinin kiçik iş və təcrübə tapa bilməməsi", "jobs"),
];

export const SEED_COMMUNITIES: Record<CommunityId, Community> = { devora, shellshock, datatech, innotech };

export const SEED: Content = {
  site: SEED_SITE,
  communities: SEED_COMMUNITIES,
  events: EVENTS,
  team: TEAM,
  mentors: MENTORS,
  partners: PARTNERS,
  faqs: FAQS,
  problems: PROBLEMS,
};

export function seedClone(): Content {
  return JSON.parse(JSON.stringify(SEED)) as Content;
}
