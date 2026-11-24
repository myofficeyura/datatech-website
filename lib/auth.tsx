"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { ADMIN_EMAILS, ALLOWED_DOMAIN, fb, firebaseEnabled, isAllowedEmail } from "./firebase";
import { getRecord, setRecord } from "./store";

export type Profile = {
  uid: string; name: string; email: string; faculty?: string; year?: string;
  points: number; badges: string[]; refCode: string; referredBy?: string | null; isAdmin: boolean;
};

type Ctx = {
  user: Profile | null; ready: boolean; error: string | null;
  signIn: () => Promise<void>; signOut: () => Promise<void>; refresh: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>({ user: null, ready: false, error: null, signIn: async () => {}, signOut: async () => {}, refresh: async () => {} });

export const refCodeFor = (uid: string) => uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase();

const DEMO_USER: Profile = {
  uid: "demo-user", name: "Nümunə Üzv", email: "numune@" + (ALLOWED_DOMAIN || "beu.edu.az"), faculty: "Kompüter mühəndisliyi", year: "2",
  points: 1240, badges: ["first-step", "info-day", "inviter"], refCode: "numune", isAdmin: true,
};

async function loadProfile(uid: string, email: string, name: string): Promise<Profile> {
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  const pub = await getRecord("members", uid);
  const priv = await getRecord("users", uid);
  if (!pub || !priv) {
    let referredBy: string | null = null;
    try { referredBy = localStorage.getItem("dt-ref"); } catch {}
    const refCode = refCodeFor(uid);
    await setRecord("users", uid, { email, name, referredBy, refCode });
    await setRecord("members", uid, { name, points: 0, badges: ["first-step"], refCode, faculty: "" });
    return { uid, email, name, points: 0, badges: ["first-step"], refCode, referredBy, isAdmin };
  }
  return {
    uid, email, name: (pub.name as string) || name, faculty: pub.faculty as string, year: priv.year as string,
    points: (pub.points as number) || 0, badges: (pub.badges as string[]) || [], refCode: (pub.refCode as string) || refCodeFor(uid),
    referredBy: (priv.referredBy as string) || null, isAdmin,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const f = fb();
    if (!f) {
      try { if (localStorage.getItem("dt-demo-signed") === "1") setUser(DEMO_USER); } catch {}
      setReady(true);
      return;
    }
    return onAuthStateChanged(f.auth, async (u) => {
      if (!u || !u.email) { setUser(null); setReady(true); return; }
      if (!isAllowedEmail(u.email)) {
        setError(`Yalnız @${ALLOWED_DOMAIN} ünvanı ilə daxil olmaq olar.`);
        await fbSignOut(f.auth); setUser(null); setReady(true); return;
      }
      try { setUser(await loadProfile(u.uid, u.email, u.displayName || u.email.split("@")[0])); }
      catch (e) { setError((e as Error).message); }
      setReady(true);
    });
  }, []);

  const signIn = async () => {
    setError(null);
    const f = fb();
    if (!f) { try { localStorage.setItem("dt-demo-signed", "1"); } catch {} setUser(DEMO_USER); return; }
    const p = new GoogleAuthProvider();
    if (ALLOWED_DOMAIN) p.setCustomParameters({ hd: ALLOWED_DOMAIN, prompt: "select_account" });
    try { await signInWithPopup(f.auth, p); } catch (e) { setError((e as Error).message); }
  };
  const signOut = async () => {
    const f = fb();
    if (!f) { try { localStorage.removeItem("dt-demo-signed"); } catch {} setUser(null); return; }
    await fbSignOut(f.auth);
  };
  const refresh = async () => {
    const f = fb();
    const u = f?.auth.currentUser;
    if (u?.email) setUser(await loadProfile(u.uid, u.email, u.displayName || ""));
  };

  return <AuthCtx.Provider value={{ user, ready, error, signIn, signOut, refresh }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
export { firebaseEnabled };
