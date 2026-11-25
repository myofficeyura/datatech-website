"use client";
import { useCallback, useEffect, useState } from "react";
import { ADMIN_EMAILS, col } from "./config";
import { MODE } from "./db";
import { getFb } from "./firebase-client";
import { isCommunityId, type CommunityId } from "./types";

export type Me = { email: string; name: string; photo?: string; role: "super" | "community"; community?: CommunityId; demo?: boolean };

const DEMO_KEY = "hub-demo-admin";

/** Admin olub-olmadığını yoxlayır: env siyahısı, hub_admins/{email} və ya DataTech-in admins/{email} sənədi. */
async function resolveRole(email: string): Promise<Pick<Me, "role" | "community"> | null> {
  const e = email.toLowerCase();
  const { fs, db } = await getFb();
  try {
    const s = await fs.getDoc(fs.doc(db, col("admins"), e));
    if (s.exists()) {
      const d = s.data() as { role?: string; community?: string };
      if (d.role === "community" && isCommunityId(d.community)) return { role: "community", community: d.community };
      return { role: "super" };
    }
  } catch {}
  try {
    const s = await fs.getDoc(fs.doc(db, "admins", e));
    if (s.exists()) return { role: "super" };
  } catch {}
  if (ADMIN_EMAILS.includes(e)) return { role: "super" };
  return null;
}

export function useAdminAuth() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (MODE === "demo") {
      try {
        const raw = sessionStorage.getItem(DEMO_KEY);
        if (raw) setMe(JSON.parse(raw) as Me);
      } catch {}
      setLoading(false);
      return;
    }
    let unsub = () => {};
    getFb().then(({ auth, authMod }) => {
      unsub = authMod.onAuthStateChanged(auth, async (u) => {
        if (!u?.email) {
          setMe(null);
          setLoading(false);
          return;
        }
        const role = await resolveRole(u.email);
        if (!role) {
          setError(`${u.email} admin siyahısında yoxdur.`);
          await authMod.signOut(auth);
          setMe(null);
        } else {
          setError("");
          setMe({ email: u.email.toLowerCase(), name: u.displayName || u.email, photo: u.photoURL || undefined, ...role });
        }
        setLoading(false);
      });
    }).catch((e) => {
      setError((e as Error).message);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async () => {
    setError("");
    const { auth, authMod } = await getFb();
    try {
      const p = new authMod.GoogleAuthProvider();
      p.setCustomParameters({ prompt: "select_account" });
      await authMod.signInWithPopup(auth, p);
    } catch (e) {
      const code = (e as { code?: string }).code || "";
      if (code === "auth/unauthorized-domain") setError("Bu domen Firebase Auth-da icazəli deyil. Firebase Console → Authentication → Settings → Authorized domains bölməsinə saytın domenini əlavə et.");
      else if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") setError((e as Error).message);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (MODE === "demo") {
      sessionStorage.removeItem(DEMO_KEY);
      setMe(null);
      return;
    }
    const { auth, authMod } = await getFb();
    await authMod.signOut(auth);
  }, []);

  const demoSignIn = useCallback((role: "super" | CommunityId) => {
    const m: Me = role === "super"
      ? { email: "demo@admin", name: "Demo admin", role: "super", demo: true }
      : { email: `demo-${role}@admin`, name: `Demo ${role} admini`, role: "community", community: role, demo: true };
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(m));
    setMe(m);
  }, []);

  return { me, loading, error, signIn, signOut, demoSignIn };
}

/** İcazə: baş admin hər şeyi, icma admini yalnız öz icmasını redaktə edir. */
export const canEdit = (me: Me | null, scope: string | undefined | null) =>
  Boolean(me && (me.role === "super" || (scope && scope === me.community)));
