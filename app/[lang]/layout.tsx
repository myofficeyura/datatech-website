import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import { SiteProvider } from "@/components/site/SiteProvider";
import { AccentStyle, BackToTop, Header, ScrollProgress, SkipLink, SmoothScroll } from "@/components/site/Chrome";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/bits";
import { SITE_URL } from "@/lib/config";
import { pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/server-content";
import type { Lang } from "@/lib/types";

export const revalidate = 60;
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "az" }, { lang: "en" }];
}

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0B132B" }, { media: "(prefers-color-scheme: light)", color: "#F5F7FC" }],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  const { content } = await getContent();
  return {
    metadataBase: new URL(SITE_URL),
    ...pageMeta(content, lang, "/", null),
    icons: { icon: content.site.favicon || "/favicon.png", apple: "/apple-touch-icon.png" },
  };
}

// Mövzu (qaranlıq əsasdır) ilk boyamadan əvvəl tətbiq olunur ki, yanıb-sönmə olmasın.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.dataset.theme=t}catch(e){}})()`;

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const { content } = await getContent();
  return (
    <html lang={lang} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <SiteProvider initial={content} lang={lang}>
          <AccentStyle />
          <SkipLink />
          <ScrollProgress />
          <SmoothScroll />
          <Header />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <BackToTop />
          <Toaster />
        </SiteProvider>
      </body>
    </html>
  );
}
