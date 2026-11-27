"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { NAV } from "@/lib/data";
import { useLang, type DictKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Icon } from "./Icon";
import { Chat } from "./Chat";

const ToastCtx = createContext<(m: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

function initials(n?: string) { return (n || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase(); }

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sheet, setSheet] = useState(false);
  const [more, setMore] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const tt = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { setTheme((document.documentElement.dataset.theme as "dark" | "light") || "dark"); }, []);
  useEffect(() => { setSheet(false); }, [path]);
  const flip = () => {
    const n = theme === "dark" ? "light" : "dark";
    setTheme(n); document.documentElement.dataset.theme = n;
    try { localStorage.setItem("dt-theme", n); } catch {}
  };
  const show = (m: string) => { setToast(m); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(null), 2400); };
  const on = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const logo = theme === "dark" ? "/img/logo-white.png" : "/img/logo-blue.png";

  const Tools = () => (
    <div className="tools">
      <button className="chip lang" type="button" onClick={() => setLang(lang === "az" ? "en" : "az")} aria-label="Dil / Language">{lang.toUpperCase()}</button>
      <button className="chip" type="button" onClick={flip} aria-label="Tema"><Icon name={theme === "dark" ? "sun" : "moon"} /></button>
    </div>
  );

  return (
    <ToastCtx.Provider value={show}>
      <div className="field" aria-hidden="true"><div className="blob b1" /><div className="blob b2" /></div>

      <aside className="rail" aria-label="Naviqasiya">
        <Link className="brand" href="/"><img src={logo} alt="" width={27} height={34} /><b>DataTech</b></Link>
        <div className="scroll">
          <nav className="nav">
            {NAV.main.map((n) => (
              <Link key={n.href} href={n.href} className={on(n.href) ? "on" : ""}><Icon name={n.icon} /><span>{t(n.key as DictKey)}</span></Link>
            ))}
            <button type="button" className="navbtn" onClick={() => setMore((v) => !v)} aria-expanded={more || NAV.more.some((n) => on(n.href))}><Icon name="more" /><span>{t("more")}</span></button>
            {(more || NAV.more.some((n) => on(n.href))) && NAV.more.map((n) => (
              <Link key={n.href} href={n.href} className={"sub " + (on(n.href) ? "on" : "")}><Icon name={n.icon} /><span>{t(n.key as DictKey)}</span></Link>
            ))}
            {user?.isAdmin && <Link href="/admin" className={on("/admin") ? "on" : ""}><Icon name="settings" /><span>{t("admin")}</span></Link>}
          </nav>
        </div>
        <Tools />
        <Link className={"cab" + (on("/kabinet") ? " on" : "")} href="/kabinet">
          <span className="av">{user ? initials(user.name) : <Icon name="user" size={16} />}</span>
          <span>{user ? t("cabinet") : t("signin")}</span>
        </Link>
      </aside>

      <header className="top">
        <Link className="brand" href="/"><img src={logo} alt="" width={22} height={28} /><b>DataTech</b></Link>
        <Tools />
      </header>

      <main><div className="wrap">{children}</div></main>

      <nav className="bottom" aria-label="Alt naviqasiya">
        {[NAV.main[0], NAV.main[2], NAV.main[3], { href: "/kabinet", key: "cabinet", icon: "user" }].map((n) => (
          <Link key={n.href} href={n.href} className={on(n.href) ? "on" : ""}><Icon name={n.icon} /><span>{t((n.key === "home" ? "home_s" : n.key) as DictKey)}</span></Link>
        ))}
        <button type="button" onClick={() => setSheet((s) => !s)} aria-expanded={sheet} className={sheet ? "on" : ""}><Icon name="more" /><span>{t("more")}</span></button>
      </nav>
      <div className={"sheet" + (sheet ? " open" : "")} aria-hidden={!sheet}>
        <div className="grid">
          {[NAV.main[1], ...NAV.main.slice(4), ...NAV.more].map((n) => (
            <Link key={n.href} href={n.href} tabIndex={sheet ? 0 : -1}><Icon name={n.icon} /><span>{t(n.key as DictKey)}</span></Link>
          ))}
          {user?.isAdmin && <Link href="/admin" tabIndex={sheet ? 0 : -1}><Icon name="settings" /><span>{t("admin")}</span></Link>}
        </div>
      </div>

      <Chat />
      <div className={"toast" + (toast ? " show" : "")} role="status">{toast}</div>
    </ToastCtx.Provider>
  );
}
