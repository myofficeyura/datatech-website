import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")),
  title: { default: "DataTech · BMU AI & Data Science icması", template: "%s · DataTech" },
  description: "DataTech: Bakı Mühəndislik Universitetinin süni intellekt və data elmi tələbə icması. Dərslər, hackathonlar, mentorluq və layihələr.",
  openGraph: { title: "DataTech", description: "BMU AI & Data Science icması", images: ["/img/gallery/infoday-podium.webp"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#070c1c" };

// Tema rəngi boyamadan əvvəl qoyulur ki, ekran yanıb-sönməsin. Defolt: qaranlıq.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('dt-theme')||'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" />
      </head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
