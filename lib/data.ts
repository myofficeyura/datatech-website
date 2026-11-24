// Saytın bütün statik məzmunu. Firebase qoşulanda tədbirlər, bloq, karyera və s.
// Firestore-dan da gələ bilər; bu fayl həm defolt məzmun, həm də çatbotun bilik bazasıdır.

export type L = { az: string; en: string };
const l = (az: string, en: string): L => ({ az, en });

export const SITE = {
  name: "DataTech",
  university: l("Bakı Mühəndislik Universiteti", "Baku Engineering University"),
  founded: "2026-11-16",
  motto: "Öyrən, sına, paylaş, inkişaf et",
  instagram: "https://instagram.com/",
  linkedin: "https://linkedin.com/",
  tiktok: "https://tiktok.com/",
  email: "datatech@beu.edu.az", // TODO: real ünvanı təsdiqlə
};

// Rəqəmlər: Firestore-da `stats/public` sənədi varsa oradan oxunur, yoxsa bunlar göstərilir.
export const STATS = { members: 130, events: 4, faculties: 7, rating: 5.0 };

export type Member = { id: string; name: string; role: L; bio: L; photo: string; linkedin?: string };
export const TEAM: Member[] = [
  { id: "yusif", name: "Yusif Əliyev", photo: "/img/team/yusif.webp",
    role: l("Lider", "Leader"),
    bio: l("Tərəfdaşlar, mentorlar, universitet rəhbərliyi və digər icmalarla əlaqə. Üzv aktivliyi alqoritmi və icmanın analitikası.",
           "Partners, mentors, university leadership and other communities. Member activity algorithm and community analytics.") },
  { id: "leman", name: "Ləman Bayramova", photo: "/img/team/leman.webp",
    role: l("Data Science və karyera mentoru", "Data Science & career mentor"),
    bio: l("CV, LinkedIn, proqramlar və elanlar. Üzvlərə 1:1 dəstək. LinkedIn səhifəsini idarə edir.",
           "CVs, LinkedIn, programs and announcements. 1:1 support for members. Runs the LinkedIn page.") },
  { id: "turqut", name: "Turqut Abbaslı", photo: "/img/team/turqut.webp",
    role: l("Yarışlar və logistika", "Competitions & logistics"),
    bio: l("Yarışlar, hackathonlar, sessiyalar, otaqlar və logistika. Daxili və xarici şəbəkələşmə.",
           "Competitions, hackathons, sessions, rooms and logistics. Internal and external networking.") },
  { id: "tariel", name: "Tariel Cəbrayılov", photo: "/img/team/tariel.webp",
    role: l("SMM və üzv cəlbi", "SMM & recruitment"),
    bio: l("TikTok və Instagram, aktiv tələbələr haqqında videolar, yeni üzvlərin cəlbi.",
           "TikTok and Instagram, videos about active students, bringing in new members.") },
  { id: "ramile", name: "Ramilə Məmmədli", photo: "/img/team/ramile.webp",
    role: l("Texnologiya və planlaşdırma", "Tech & planning"),
    bio: l("Sayt, açıq dərslər və imtahanlar, yarış sualları, sənədləşmə, arxiv və planlaşdırma.",
           "Website, open lessons and exams, contest questions, documentation, archive and planning.") },
  { id: "zehra", name: "Zəhra Ağayeva", photo: "/img/team/zehra.webp",
    role: l("Dəstək və üzv cəlbi", "Support & recruitment"),
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
  { slug: "ai-ve-insan", title: l("AI və İnsan: canlı yarış", "AI vs Human: live challenge"), date: "2026-12-05", time: "15:00",
    place: l("BMU, akt zalı", "BEU, assembly hall"), type: "event", capacity: 80, registered: 58, sample: true,
    desc: l("Tələbələr və AI eyni tapşırığı canlı həll edir, zal səs verir. Dostunu gətir: hər dəvət +50 xal.",
            "Students and AI solve the same task live while the audience votes. Bring a friend: +50 points per invite.") },
  { slug: "python-data-giris", title: l("Python ilə data analizi: Giriş", "Intro to data analysis with Python"), date: "2026-12-12", time: "16:00",
    place: l("BMU, kompüter otağı", "BEU, computer lab"), type: "workshop", capacity: 30, registered: 21, sample: true,
    desc: l("pandas ilə ilk dataset: oxumaq, təmizləmək, sadə qrafik. Noutbukunu gətir.",
            "Your first dataset with pandas: load, clean, plot. Bring your laptop.") },
  { slug: "mini-hackathon", title: l("Daxili mini-hackathon", "Internal mini-hackathon"), date: "2026-12-20", time: "10:00",
    place: l("BMU, kitabxana zalı", "BEU, library hall"), type: "hackathon", capacity: 60, registered: 29, sample: true,
    desc: l("6 saat, 3-4 nəfərlik komandalar, real data üzərində tapşırıq. Komandan yoxdursa, Komanda axtar bölməsinə bax.",
            "6 hours, teams of 3-4, a real-data challenge. No team yet? Check the Team finder.") },
  { slug: "info-gun", title: l("İnfo gün", "Info day"), date: "2026-11-19", time: "14:00",
    place: l("BMU", "BEU"), type: "info", capacity: 60, registered: 60, past: true, rating: 5.0, ratingCount: 40,
    gallery: ["/img/gallery/infoday-podium.webp", "/img/gallery/infoday-seated.webp"],
    desc: l("DataTech-in ilk açıq görüşü. Planlarımızı paylaşdıq, hər iştirakçı 5 ulduz verdi.",
            "DataTech's first open meetup. We shared our plans and every attendee gave 5 stars.") },
];

export type RoadItem = { date: string; title: L; desc: L; tag: "event" | "learn" | "growth" | "milestone" };
// Yeni tarixli plan (24.11.2026). Köhnə 90 günlük plan istifadə olunmur.
export const ROADMAP_90: RoadItem[] = [
  { date: "2026-11-28", tag: "milestone", title: l("Final seçim", "Final selection"), desc: l("İcma statusunun təsdiqi üçün münsiflər qarşısında təqdimat.", "Presentation to the jury to confirm community status.") },
  { date: "2026-12-01", tag: "growth", title: l("Saytın açılışı", "Website launch"), desc: l("Qeydiyyat, kabinet, reytinq və tədbir qeydiyyatı işə düşür.", "Sign-up, cabinet, leaderboard and event registration go live.") },
  { date: "2026-12-05", tag: "event", title: l("AI və İnsan: canlı yarış", "AI vs Human: live challenge"), desc: l("İlk böyük tədbir. \"Dostunu gətir\" kampaniyası.", "First big event with a bring-a-friend campaign.") },
  { date: "2026-12-12", tag: "learn", title: l("Workshop 1: Python ilə data analizi", "Workshop 1: data analysis with Python"), desc: l("pandas ilə ilk addımlar.", "First steps with pandas.") },
  { date: "2026-12-15", tag: "growth", title: l("İlk aylıq reytinq və mükafat", "First monthly leaderboard and award"), desc: l("Ən aktiv üzv elan olunur və mükafatlandırılır.", "The most active member is announced and rewarded.") },
  { date: "2026-12-20", tag: "event", title: l("Daxili mini-hackathon", "Internal mini-hackathon"), desc: l("Innoventure, Devora və ShellShock ilə birgə.", "Together with Innoventure, Devora and ShellShock.") },
  { date: "2026-12-28", tag: "learn", title: l("İmtahan dövrü: yüngül rejim", "Exam period: light mode"), desc: l("Həftəlik quiz və online resurslar davam edir, canlı tədbir yoxdur.", "Weekly quiz and online resources continue, no live events.") },
  { date: "2027-01-15", tag: "learn", title: l("Mentorluq proqramı başlayır", "Mentorship program starts"), desc: l("CV, LinkedIn və karyera üçün 1:1 görüşlər.", "1:1 sessions for CVs, LinkedIn and careers.") },
  { date: "2027-01-25", tag: "learn", title: l("Workshop 2: pandas və vizualizasiya", "Workshop 2: pandas & visualisation"), desc: l("Datadan hekayə qurmaq.", "Telling stories with data.") },
  { date: "2027-02-01", tag: "growth", title: l("Layihə komandaları qurulur", "Project teams form"), desc: l("Komanda axtar bölməsi ilə Demo Day-ə hazırlıq başlayır.", "Demo Day preparation starts via the Team finder.") },
  { date: "2027-02-08", tag: "event", title: l("Karyera sessiyası", "Career session"), desc: l("Sənayedən qonaq: data sahəsində ilk iş.", "Industry guest: your first data job.") },
  { date: "2027-02-22", tag: "milestone", title: l("90 gün hesabatı", "90-day report"), desc: l("Hədəf: 250 üzv, 8 tədbir, orta rəy ən az 4.5.", "Target: 250 members, 8 events, average rating at least 4.5.") },
];
export const ROADMAP_YEAR: RoadItem[] = [
  { date: "2027-03-01", tag: "learn", title: l("ML əsasları kursu (6 həftə)", "ML fundamentals course (6 weeks)"), desc: l("Sonda yoxlanıla bilən sertifikat.", "Ends with a verifiable certificate.") },
  { date: "2027-04-17", tag: "event", title: l("Sponsorlu açıq hackathon", "Sponsored open hackathon"), desc: l("Tərəfdaşlar və sponsorlarla, BMU-dan kənar komandalar üçün də.", "With partners and sponsors, open to teams beyond BEU.") },
  { date: "2027-05-22", tag: "milestone", title: l("Demo Day #1", "Demo Day #1"), desc: l("Üzvlərin layihələrinin ictimai təqdimatı.", "Public showcase of member projects.") },
  { date: "2027-06-10", tag: "growth", title: l("Yay təcrübəsi bələdçisi", "Summer internship guide"), desc: l("Karyera lövhəsi və müraciətlərə 1:1 dəstək.", "Career board and 1:1 help with applications.") },
  { date: "2027-07-01", tag: "learn", title: l("Yay layihə sprinti (online)", "Summer project sprint (online)"), desc: l("Kaggle komandası və açıq mənbə layihələr.", "Kaggle team and open-source projects.") },
  { date: "2027-09-15", tag: "growth", title: l("Yeni tələbələr üçün info gün", "Info day for new students"), desc: l("Ambassador proqramı ilə 1-ci kurslara çatmaq.", "Reaching first-years through the ambassador program.") },
  { date: "2027-10-15", tag: "event", title: l("Milli hackathonlarda iştirak", "National hackathons"), desc: l("DataTech komandaları ölkə üzrə yarışlara gedir.", "DataTech teams compete nationally.") },
  { date: "2027-11-16", tag: "milestone", title: l("1 illik yubiley", "First anniversary"), desc: l("İllik hesabat. Hədəf: 500 üzv, 25 tədbir, 10 layihə.", "Annual report. Target: 500 members, 25 events, 10 projects.") },
];

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

export const COMPETITIONS = [
  { title: l("Daxili mini-hackathon", "Internal mini-hackathon"), date: "2026-12-20", kind: l("DataTech", "DataTech"), url: "/tedbirler/mini-hackathon", status: "open" as const },
  { title: l("Kaggle Getting Started yarışları", "Kaggle Getting Started competitions"), date: "", kind: l("Online, daimi", "Online, ongoing"), url: "https://www.kaggle.com/competitions?hostSegmentIdFilter=5", status: "open" as const },
  { title: l("Sponsorlu açıq hackathon", "Sponsored open hackathon"), date: "2027-04-17", kind: l("DataTech + tərəfdaşlar", "DataTech + partners"), url: "/yol-xeritesi", status: "soon" as const },
];

export const POSTS = [
  { slug: "niye-datatech", date: "2026-11-16", author: "Yusif Əliyev",
    title: l("Niyə DataTech?", "Why DataTech?"),
    excerpt: l("BMU-da data və AI ilə maraqlanan tələbələr üçün ortaq bir məkan lazım idi.", "BEU students interested in data and AI needed a shared place."),
    body: l(
      "BMU-da data və süni intellektlə maraqlanan çox tələbə var, amma onlar tək-tək öyrənirdi. DataTech onları bir yerə yığmaq üçün yarandı.\n\nMəqsədimiz sadədir: hər üzv data ilə real bir şey qursun və bunu başqaları ilə bölüşsün. Bunun üçün açıq dərslər, hackathonlar, mentorluq və layihə komandaları təşkil edirik.\n\nQoşulmaq üçün yalnız BMU tələbəsi olmaq kifayətdir. Təcrübə tələb olunmur.",
      "Many BEU students are interested in data and AI, but they were learning alone. DataTech exists to bring them together.\n\nOur goal is simple: every member builds something real with data and shares it. We run open lessons, hackathons, mentoring and project teams.\n\nAll you need to join is to be a BEU student. No experience required.") },
  { slug: "info-gun-yekunlari", date: "2026-11-20", author: "DataTech",
    title: l("İnfo günün yekunları", "Info day recap"),
    excerpt: l("İlk görüşümüzdə hər iştirakçı 5 ulduz verdi.", "Every attendee of our first meetup gave 5 stars."),
    body: l(
      "19 noyabrda DataTech-in ilk açıq görüşünü keçirdik. Tələbələrə icmanın nə edəcəyini, necə qoşulmağı və ilk planlarımızı danışdıq.\n\nTədbirdən sonra topladığımız rəylərdə hər iştirakçı 5 ulduz verdi. Ən çox soruşulan suallar hackathonlar və mentorluq haqqında idi, ona görə də ilk 90 günlük planımıza hər ikisini daxil etdik.\n\nNövbəti tədbirlər üçün Tədbirlər səhifəsinə bax.",
      "On 19 November we held DataTech's first open meetup. We told students what the community will do, how to join and what our first plans are.\n\nIn the feedback afterwards every attendee gave 5 stars. Most questions were about hackathons and mentoring, so both are in our first 90-day plan.\n\nSee the Events page for what's next.") },
];

export const MENTORS = [
  { id: "leman", name: "Ləman Bayramova", photo: "/img/team/leman.webp", topics: l("CV, LinkedIn, Data Science karyerası", "CV, LinkedIn, Data Science careers"), slots: ["Çərşənbə 15:00", "Cümə 13:00"] },
  { id: "yusif", name: "Yusif Əliyev", photo: "/img/team/yusif.webp", topics: l("Data analitika, layihə ideyaları", "Data analytics, project ideas"), slots: ["Çərşənbə axşamı 16:00"] },
  { id: "ramile", name: "Ramilə Məmmədli", photo: "/img/team/ramile.webp", topics: l("Veb, sayt layihələri, planlaşdırma", "Web, website projects, planning"), slots: ["Cümə axşamı 14:00"] },
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

export const FAQ = [
  { q: l("Kim qoşula bilər?", "Who can join?"), a: l("Bütün fakültələrdən BMU tələbələri. Təcrübə tələb olunmur.", "BEU students from every faculty. No experience needed.") },
  { q: l("Üzvlük pulludur?", "Is membership paid?"), a: l("Xeyr, üzvlük və tədbirlər pulsuzdur.", "No, membership and events are free.") },
  { q: l("Xallar necə hesablanır?", "How are points calculated?"), a: l("Tədbirlərdə iştirak, formalar, quiz, dəvətlər və qrup aktivliyinə görə. Ayın birincisi mükafat qazanır.", "From events, forms, quizzes, invites and group activity. The top member each month wins a reward.") },
  { q: l("Sertifikatı necə yoxlamaq olar?", "How do I verify a certificate?"), a: l("Hər sertifikatın kodu var. Sertifikat səhifəsində kodu daxil et.", "Every certificate has a code. Enter it on the certificate page.") },
  { q: l("Proqramlaşdırma bilmirəm, qoşula bilərəm?", "I can't code. Can I join?"), a: l("Bəli. Başlanğıc workshopları məhz bunun üçündür.", "Yes. The beginner workshops are made for that.") },
  { q: l("Tədbir təklif etmək istəyirəm.", "I want to suggest an event."), a: l("Rəy formasından yaz, idarə heyəti hər həftə oxuyur.", "Write it in the feedback form; the board reads it every week.") },
];

export const QUIZ = {
  week: "2026-W48",
  questions: [
    { q: l("pandas-da cədvəlin ilk 5 sətrini hansı metod göstərir?", "Which pandas method shows the first 5 rows?"), options: ["df.top()", "df.head()", "df.first()", "df.show()"], answer: 1 },
    { q: l("Hansı nəzarətli öyrənmə (supervised) tapşırığıdır?", "Which is a supervised learning task?"), options: ["Klasterləşmə", "Reqressiya", "PCA", "t-SNE"], answer: 1 },
    { q: l("Overfitting nə deməkdir?", "What does overfitting mean?"), options: ["Model train datasını əzbərləyir, yeni datada zəifdir", "Model çox sadədir", "Data çox azdır", "Model çox sürətli öyrənir"], answer: 0 },
    { q: l("Median orta qiymətdən nə ilə fərqlənir?", "How is the median different from the mean?"), options: ["Həmişə böyükdür", "Kənar qiymətlərə daha az həssasdır", "Yalnız mətnlər üçündür", "Fərqi yoxdur"], answer: 1 },
    { q: l("SQL-də sətirləri süzmək üçün hansı açar söz işlənir?", "Which SQL keyword filters rows?"), options: ["ORDER BY", "GROUP BY", "WHERE", "SELECT"], answer: 2 },
  ],
};

// Xal qaydaları. Yusifin alqoritmi burada tənzimlənir.
export const POINTS = {
  signup: 100, eventAttend: 200, eventRegister: 50, feedback: 40, invite: 50,
  quizCorrect: 20, groupMessageWeek: 10, projectSubmit: 300, hackathon: 300,
};

export const NAV = {
  main: [
    { href: "/", key: "home", icon: "home" },
    { href: "/haqqimizda", key: "about", icon: "info" },
    { href: "/tedbirler", key: "events", icon: "cal" },
    { href: "/yol-xeritesi", key: "roadmap", icon: "road" },
    { href: "/resurslar", key: "resources", icon: "book" },
    { href: "/reytinq", key: "rating", icon: "trophy" },
  ],
  more: [
    { href: "/komanda", key: "team", icon: "people" },
    { href: "/layiheler", key: "projects", icon: "code" },
    { href: "/yarislar", key: "competitions", icon: "bolt" },
    { href: "/komanda-axtar", key: "teamfinder", icon: "search" },
    { href: "/quiz", key: "quiz", icon: "spark" },
    { href: "/mentorlar", key: "mentors", icon: "user" },
    { href: "/karyera", key: "career", icon: "brief" },
    { href: "/xeberler", key: "news", icon: "news" },
    { href: "/blog", key: "blog", icon: "pen" },
    { href: "/qalereya", key: "gallery", icon: "image" },
    { href: "/statistika", key: "stats", icon: "chart" },
    { href: "/terefdaslar", key: "partners", icon: "hand" },
    { href: "/nisanlar", key: "badges", icon: "star" },
    { href: "/sertifikat", key: "certificate", icon: "shield" },
    { href: "/faq", key: "faq", icon: "help" },
    { href: "/rey", key: "feedback", icon: "pen" },
    { href: "/elaqe", key: "contact", icon: "mail" },
  ],
} as const;
