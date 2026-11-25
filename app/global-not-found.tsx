import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "404 · BMU İcmaları", robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="az" data-theme="dark">
      <body style={{ ["--accent" as string]: "#6366F1" }}>
        <div className="relative grid min-h-dvh place-items-center overflow-hidden px-6">
          <div className="aurora" aria-hidden="true" />
          <main className="relative text-center">
            <p className="eyebrow eyebrow-accent">404</p>
            <h1 className="h-display mt-4 text-5xl">Səhifə tapılmadı</h1>
            <p className="lead mt-4">Axtardığın səhifə yoxdur və ya ünvanı dəyişib.</p>
            <p className="mt-1 text-sm text-faint">Page not found.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="/" className="btn btn-primary">Ana səhifə</a>
              <a href="/en" className="btn btn-ghost">Home (EN)</a>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
