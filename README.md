# BMU İcmaları: ortaq sayt

Bakı Mühəndislik Universitetinin 4 tələbə icmasının ortaq saytı: **DevOra** (proqramlaşdırma, open source), **ShellShock** (kibertəhlükəsizlik), **DataTech** (AI və Data Science), **InnoTech** (innovativ sahibkarlıq).

Next.js (App Router) + TypeScript + Tailwind + framer-motion + Lenis, Firebase (Auth, Firestore, Storage), Vercel.

> Bu kod `datatech-website` reposunun ayrıca branch-ındadır. DataTech saytı (`main`) ilə eyni Firebase layihəsini işlədir, amma bütün məlumatlar `hub_` prefiksli kolleksiyalardadır (`hub_events`, `hub_team` ...), DataTech-in kolleksiyalarına toxunmur.

## Səhifələr

| Ünvan | Nə var |
|---|---|
| `/` | Ortaq ana səhifə: 4 icma kartı, ümumi statistika, birgə tədbirlər, təqvim, Problem Bank, əməkdaşlıq, FAQ, qoşul |
| `/devora`, `/shellshock`, `/datatech`, `/innotech` | Hər icmanın tam səhifəsi: hero, haqqında, nə edirik (5 addım), rollar, tədbirlər, Problem Bank, tərəfdaşlar, komanda, mentorlar, əməkdaşlıq, FAQ, qoşul |
| `/events`, `/events/<slug>` | Tədbirlər (icma filtri), tədbir səhifəsi: qalereya, proqram, qaliblər, qeydiyyat |
| `/problem-bank` | Problem göndər (2 addım) və təsdiqlənmiş problemlər |
| `/team`, `/partners`, `/faq`, `/contact` | Komanda (icma tabları), tərəfdaşlar, FAQ + sual forması, əlaqə |
| `/en/...` | Hər səhifənin ingiliscə versiyası (əsas dil AZ) |
| `/admin` | Admin paneli |

Məlumat olmayan bölmə "Tezliklə" göstərir və ya gizlənir. Sıfır olan statistika və boş linklər saytda görünmür.

## Admin paneli (`/admin`)

Google ilə giriş. Dəyişikliklər saytda **dərhal** görünür (redeploy lazım deyil).

- **Loqo və rəng:** hər icma və ortaq sayt üçün loqo yüklə (qaranlıq və işıqlı tema versiyası), önizləmə, əvvəlki loqoya qayıt (tarixçə), favicon, aksent rəngi (canlı önizləmə ilə).
- **Mətnlər:** hero, haqqında, nə edirik, rollar, AZ və EN.
- **Linklər və statistika:** WhatsApp, Instagram, TikTok, LinkedIn, Telegram, e-poçt; üzv, tədbir, layihə sayları.
- **Tədbirlər, komanda, mentorlar, tərəfdaşlar, FAQ:** əlavə et, redaktə et, sil; şəkillər; sürüşdürərək sıralama. Tədbirdə qalereya, qeydiyyat açıq/bağlı, iştirakçıların CSV-si.
- **Problem Bank:** təsdiqlə, rədd et, icmaya yönləndir, saytda göstər.
- **Suallar və müraciətlər:** "cavablandı" işarəsi.
- **QR generator:** ortada icmanın loqosu, xəta korreksiyası "H".
- **Adminlər** (yalnız baş admin): icma adminləri təyin et.

**İcazələr:** baş admin hər şeyi redaktə edir. İcma admini yalnız öz icmasının məlumatını redaktə edir.

## Qurulum

```bash
npm install
cp .env.example .env.local   # dəyərləri doldur
npm run dev                   # http://localhost:3000
npm run build                 # yoxlama
```

Firebase açarları boş olsa sayt **demo rejimində** işləyir: məzmun `lib/seed.ts`-dən gəlir, `/admin`-də "Demo admin kimi daxil ol" düyməsi var və dəyişikliklər yalnız həmin brauzerdə saxlanır.

## Firebase (addım-addım)

DataTech saytı ilə eyni layihə (`datatech-3b616`) istifadə olunur.

1. **Açarlar.** Vercel-də `NEXT_PUBLIC_FIREBASE_*` dəyərləri DataTech layihəsindəki ilə eynidir (Firebase Console → Project settings → Your apps → Web app). Ayrı Vercel layihəsi yaradırsansa, onları ora da əlavə et.
2. **Google girişi.** Authentication → Sign-in method → Google aktiv olmalıdır (DataTech üçün artıq aktivdir). Authentication → Settings → **Authorized domains**: bu saytın domenini əlavə et (məs. `bmu-icmalar.vercel.app` və ya preview domeni).
3. **Firestore qaydaları.** Firestore Database → Rules: bu repodakı `firestore.rules` faylının **hamısını** yapışdır və Publish et. Faylda DataTech-in köhnə qaydaları olduğu kimi saxlanılıb, sonuna `hub_` qaydaları əlavə olunub. Ona görə DataTech saytı işləməyə davam edir.
   - Diqqət: gələcəkdə DataTech-in qaydaları dəyişsə, hər iki hissəni bir faylda saxla.
4. **Storage (istəyə bağlı).** Storage aktivdirsə, Storage → Rules: `storage.rules` faylını yapışdır. Storage aktiv deyilsə, admin paneli şəkilləri avtomatik Firestore-da saxlayır (`hub_media`, şəkil başına ~700 KB-a qədər, webp-ə çevrilir).
5. **Adminlər.**
   - DataTech-in `admins/{email}` sənədi olan hər kəs burada avtomatik **baş admindir**.
   - Başqa baş admin: Firestore-da `hub_admins/{email}` sənədi, `role: "super"`.
   - İcma admini: `hub_admins/{email}`, `role: "community"`, `community: "devora" | "shellshock" | "datatech" | "innotech"`. Bunu admin panelinin "Adminlər" bölməsindən də etmək olar.
   - `NEXT_PUBLIC_ADMIN_EMAILS` yalnız paneli açır; yazmaq üçün yuxarıdakı Firestore sənədi lazımdır.
6. **Defolt məzmun.** `/admin` → İcmal → **"Defolt məzmunu yüklə"**. Bu, `lib/seed.ts`-dəki real məzmunu Firestore-a yazır. Bundan sonra hər şey admin paneldən idarə olunur.

## Vercel

- Framework: Next.js, build: `npm run build`. Əlavə konfiqurasiya lazım deyil.
- `NEXT_PUBLIC_SITE_URL`: saytın əsas ünvanı (sitemap, canonical, OG üçün).
- Formalar `/api/forms` vasitəsilə yazılır: honeypot, minimum doldurma müddəti, IP limiti (10 dəqiqədə 6) və sahə yoxlaması. Firestore qaydaları da ölçü və sahələri yoxlayır.

## Struktur

```
app/[lang]/...          səhifələr (az, en); / → az (rewrite), /az/... → /... (redirect)
app/admin               admin paneli
app/api/forms           formalar (problem, sual, əlaqə, əməkdaşlıq, qeydiyyat)
app/api/revalidate      admin dəyişikliyindən sonra keşi təmizləyir
app/api/media/[id]      Firestore-da saxlanılan şəkillər
components/site         header, footer, tema, dil, icma seçimi
components/sections     hero, bölmələr, formalar
components/views        səhifə görünüşləri
components/admin        admin paneli
lib/seed.ts             defolt (real) məzmun
lib/types.ts            məlumat modeli
```

## Loqolar

`public/logos/` içindəki loqolar göndərildiyi kimi istifadə olunur (dəyişdirilməyib). Ağ fonlu loqolar ağ kart içində göstərilir. DevOra və ShellShock üçün loqo yoxdur: baş hərflər göstərilir. Loqonu admin paneldən yükləmək kifayətdir.
