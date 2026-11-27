# DataTech saytı

Bakı Mühəndislik Universitetinin AI & Data Science icması DataTech-in saytı. Next.js (App Router) + Firebase (Auth, Firestore) + Vercel.

## Nə var

- **Əsas:** ana səhifə, haqqımızda, komanda, tədbirlər (qeydiyyat, keçmiş tədbirlər, qalereya, reytinq), tarixli 90 günlük və 1 illik yol xəritəsi, qoşulma forması (yalnız BMU e-poçtu), əlaqə.
- **Üzv hissəsi:** kabinet (xal, reytinq yeri, nişanlar, sertifikatlar, dəvət linki, qeydiyyatlar), reytinq, nişanlar, sertifikat yoxlama (`/sertifikat/<kod>`, PDF kimi çap), dəvət linki (`/d/<kod>`).
- **İcma:** resurslar, layihələr / Demo Day, yarışlar, komanda axtar, həftəlik quiz, mentor 1:1 görüş, karyera lövhəsi, AI xəbər lenti (RSS), bloq, qalereya, statistika, tərəfdaşlar, FAQ, həmişə açıq rəy forması.
- **AI köməkçi:** sağ altda. Claude Haiku 5.5, yalnız saytdakı məlumatla cavab verir, gündə 20 sual limiti (`app/api/chat/route.ts`).
- **Admin paneli** (`/admin`): gizli QR izləmə generatoru (`/r/<kod>` skanları sayır), müraciətlər, qeydiyyatlar, xal və nişan vermək, sertifikat vermək, layihələri təsdiqləmək, karyera elanları, rəylər, mesajlar, mentor görüşləri. Hər cədvəl CSV kimi yüklənir.
- Dizayn: qaranlıq tema defolt, işıqlı tema, AZ/EN, telefonda alt menyu, kompüterdə sol menyu.

## Demo rejimi

Firebase açarları yoxdursa sayt **demo rejimində** işləyir: "Demo hesabla daxil ol" düyməsi var, göndərilən hər şey brauzerin localStorage-ında saxlanır. Beləliklə Firebase qurulmamış da saytı tam yoxlamaq olar.

## Qurulum

```bash
npm install
cp .env.example .env.local   # dəyərləri doldur
npm run dev
```

### Firebase

1. console.firebase.google.com → yeni layihə.
2. **Authentication → Sign-in method → Google** aktiv et. **Settings → Authorized domains**-ə Vercel domenini əlavə et.
3. **Firestore Database** yarat (production mode).
4. `firestore.rules` faylındakı domeni (`std.beu.edu.az`) real BMU domeni ilə yoxla və qaydaları Console → Firestore → Rules-a yapışdır.
5. Admin etmək üçün Firestore-da `admins` kolleksiyası yarat, sənəd id-si adminin e-poçtu olsun (məs. `admins/yusif@...`). Eyni e-poçtları `NEXT_PUBLIC_ADMIN_EMAILS`-ə də yaz.
6. Project settings → Your apps → Web app → konfiqurasiyanı `.env.local` / Vercel-ə köçür.

### Vercel

1. vercel.com → **Add New → Project → Import** bu repo.
2. Environment Variables-a `.env.example`-dakı dəyişənləri əlavə et. `GEMINI_API_KEY` (və ya `ANTHROPIC_API_KEY`) və `CHAT_COOKIE_SECRET` gizlidir, yalnız Vercel-də saxla.
3. Deploy.

## Məzmunu dəyişmək

Statik məzmun bir yerdədir: `lib/data.ts` (komanda, tədbirlər, yol xəritəsi, resurslar, quiz, FAQ, xal qaydaları). Çatbot da bu faylı oxuyur, ona görə dəyişikliklər avtomatik ona da çatır.

Xal qaydaları: `POINTS` (`lib/data.ts`). Xalları admin paneldən "Xal və nişan" bölməsi verir.

## Qeydlər

- Çatbot limiti cookie + server yaddaşı ilə saxlanır (ən yaxşı cəhd). Dəqiq limit lazım olsa Upstash Redis və ya Firestore Admin SDK ilə saxlamaq olar.
- Placeholder rəqəmlər: `STATS` (4 tədbir, 7 fakültə), dekabr tədbirləri, mentorların vaxtları, sosial şəbəkə linkləri və `SITE.email`. Təsdiqlənəndə `lib/data.ts`-də dəyiş.
