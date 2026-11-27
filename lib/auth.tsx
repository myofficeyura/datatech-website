"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signOut as fbSignOut, updateProfile,
} from "firebase/auth";
import { ADMIN_EMAILS, ALLOWED_DOMAIN, fb, firebaseEnabled, isAllowedEmail } from "./firebase";
import { getRecord, setRecord } from "./store";
import { setTrackAdmin, track } from "./track";

export type Profile = {
  uid: string; name: string; email: string; faculty?: string; year?: string;
  points: number; badges: string[]; refCode: string; referredBy?: string | null; isAdmin: boolean;
};

type Ctx = {
  user: Profile | null; ready: boolean; error: string | null;
  /** Qeydiyyatdan keçib, amma e-poçtunu hələ təsdiqləməyib. */
  pending: string | null;
  /** Demo rejimində demo hesabla girir; əks halda giriş səhifəsinə aparır. */
  signIn: () => Promise<void>;
  signInEmail: (email: string, pw: string) => Promise<void>;
  signUpEmail: (name: string, email: string, pw: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerify: () => Promise<void>;
  checkVerified: () => Promise<void>;
  /** Google yalnız admin üçündür. */
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>; refresh: () => Promise<void>;
};
const noop = async () => {};
const AuthCtx = createContext<Ctx>({ user: null, ready: false, error: null, pending: null, signIn: noop, signInEmail: noop, signUpEmail: noop, resetPassword: noop, resendVerify: noop, checkVerified: noop, signInGoogle: noop, signOut: noop, refresh: noop });

// Firebase xəta kodlarını Azərbaycan dilinə çevirir.
function azErr(e: unknown) {
  const c = (e as { code?: string })?.code || "";
  const m: Record<string, string> = {
    "auth/invalid-credential": "E-poçt və ya şifrə yanlışdır.", "auth/wrong-password": "E-poçt və ya şifrə yanlışdır.", "auth/user-not-found": "Bu e-poçtla hesab yoxdur. Əvvəlcə qeydiyyatdan keç.",
    "auth/email-already-in-use": "Bu e-poçtla artıq hesab var. \"Daxil ol\" bölməsindən gir.", "auth/weak-password": "Şifrə ən azı 8 simvol olmalıdır.",
    "auth/invalid-email": "E-poçt düzgün deyil.", "auth/too-many-requests": "Çox cəhd oldu. Bir neçə dəqiqə sonra yenidən yoxla.",
    "auth/operation-not-allowed": "E-poçt ilə giriş hələ aktiv edilməyib. Adminə yaz.", "auth/popup-closed-by-user": "Pəncərə bağlandı.",
    "auth/network-request-failed": "İnternet bağlantısını yoxla.",
  };
  return m[c] || (e as Error)?.message || "Xəta baş verdi.";
}
const studentEmail = (email: string) => Boolean(ALLOWED_DOMAIN) ? email.toLowerCase().endsWith("@" + ALLOWED_DOMAIN) : true;

export const refCodeFor = (uid: string) => uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase();

const DEMO_USER: Profile = {
  uid: "demo-user", name: "Nümunə Üzv", email: "numune@" + (ALLOWED_DOMAIN || "std.beu.edu.az"), faculty: "Kompüter mühəndisliyi", year: "2",
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
    await setRecord("members", uid, { name, points: 0, badges: ["first-step"], refCode, faculty: "", joinedAt: new Date().toISOString() });
    setTrackAdmin(isAdmin); track("sign_up", { label: referredBy ? `ref:${referredBy}` : "" });
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
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    const f = fb();
    if (!f) {
      try { if (localStorage.getItem("dt-demo-signed") === "1") setUser(DEMO_USER); } catch {}
      setReady(true);
      return;
    }
    return onAuthStateChanged(f.auth, async (u) => {
      if (!u || !u.email) { setUser(null); setPending(null); setReady(true); return; }
      const admin = ADMIN_EMAILS.includes(u.email.toLowerCase());
      const google = u.providerData.some((p) => p.providerId === "google.com");
      // Tələbələr yalnız BMU e-poçtu + şifrə ilə; Google ilə giriş yalnız admin üçündür.
      if (!isAllowedEmail(u.email) || (google && !admin)) {
        setError(google && !admin ? "Google ilə giriş yalnız admin üçündür. BMU e-poçtun və şifrənlə daxil ol və ya qeydiyyatdan keç." : `Yalnız @${ALLOWED_DOMAIN} ünvanı ilə daxil olmaq olar.`);
        await fbSignOut(f.auth); setUser(null); setReady(true); return;
      }
      // E-poçt təsdiqlənməyibsə, profil yaradılmır (Firestore qaydaları da buna icazə vermir).
      if (!u.emailVerified && !admin) { setPending(u.email); setUser(null); setReady(true); return; }
      setPending(null);
      try {
        const p = await loadProfile(u.uid, u.email, u.displayName || u.email.split("@")[0]);
        setTrackAdmin(p.isAdmin);
        try { if (sessionStorage.getItem("dt-signed") !== u.uid) { sessionStorage.setItem("dt-signed", u.uid); track("sign_in"); } } catch {}
        setUser(p);
      }
      catch (e) { setError((e as Error).message); }
      setReady(true);
    });
  }, []);

  const signIn = async () => {
    setError(null);
    const f = fb();
    if (!f) { try { localStorage.setItem("dt-demo-signed", "1"); } catch {} setUser(DEMO_USER); return; }
    if (!location.pathname.startsWith("/kabinet")) location.href = "/kabinet";
  };
  const demo = () => { try { localStorage.setItem("dt-demo-signed", "1"); } catch {} setUser(DEMO_USER); };
  const signInEmail = async (email: string, pw: string) => {
    setError(null); const f = fb(); if (!f) return demo();
    try { await signInWithEmailAndPassword(f.auth, email.trim(), pw); } catch (e) { setError(azErr(e)); }
  };
  const signUpEmail = async (name: string, email: string, pw: string) => {
    setError(null); const f = fb(); if (!f) return demo();
    const em = email.trim().toLowerCase();
    if (!studentEmail(em)) { setError(`Qeydiyyat yalnız @${ALLOWED_DOMAIN} ünvanı ilədir.`); return; }
    if (pw.length < 8) { setError("Şifrə ən azı 8 simvol olmalıdır."); return; }
    try {
      const c = await createUserWithEmailAndPassword(f.auth, em, pw);
      if (name.trim()) await updateProfile(c.user, { displayName: name.trim() });
      await sendEmailVerification(c.user, { url: location.origin + "/kabinet" });
      setPending(em);
    } catch (e) { setError(azErr(e)); }
  };
  const resetPassword = async (email: string) => {
    setError(null); const f = fb(); if (!f) return;
    if (!email.trim()) { setError("Əvvəlcə e-poçtunu yaz."); return; }
    try { await sendPasswordResetEmail(f.auth, email.trim(), { url: location.origin + "/kabinet" }); setError("Şifrəni yeniləmə linki e-poçtuna göndərildi (Spam qovluğuna da bax)."); }
    catch (e) { setError(azErr(e)); }
  };
  const resendVerify = async () => {
    const u = fb()?.auth.currentUser; if (!u) return;
    try { await sendEmailVerification(u, { url: location.origin + "/kabinet" }); setError("Təsdiq linki yenidən göndərildi."); } catch (e) { setError(azErr(e)); }
  };
  const checkVerified = async () => {
    const f = fb(); const u = f?.auth.currentUser; if (!f || !u) return;
    await u.reload(); await u.getIdToken(true);
    if (!u.emailVerified) { setError("Hələ təsdiqlənməyib. E-poçtundakı linkə klik et (Spam qovluğuna da bax)."); return; }
    setError(null); setPending(null); setReady(false);
    try { const p = await loadProfile(u.uid, u.email!, u.displayName || u.email!.split("@")[0]); setTrackAdmin(p.isAdmin); track("sign_in"); setUser(p); }
    catch (e) { setError((e as Error).message); }
    setReady(true);
  };
  const signInGoogle = async () => {
    setError(null);
    const f = fb();
    if (!f) return demo();
    const p = new GoogleAuthProvider();
    p.setCustomParameters({ prompt: "select_account" });
    try { await signInWithPopup(f.auth, p); } catch (e) { setError(azErr(e)); }
  };
  const signOut = async () => {
    const f = fb();
    if (!f) { try { localStorage.removeItem("dt-demo-signed"); } catch {} setUser(null); return; }
    setPending(null); await fbSignOut(f.auth);
  };
  const refresh = async () => {
    const f = fb();
    const u = f?.auth.currentUser;
    if (u?.email) setUser(await loadProfile(u.uid, u.email, u.displayName || ""));
  };

  return <AuthCtx.Provider value={{ user, ready, error, pending, signIn, signInEmail, signUpEmail, resetPassword, resendVerify, checkVerified, signInGoogle, signOut, refresh }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
export { firebaseEnabled };
