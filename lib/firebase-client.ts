"use client";
// Firebase SDK-sı yalnız lazım olanda (dinamik import) yüklənir ki, ilk açılış sürətli olsun.
import { firebaseConfig } from "./config";

type Fb = {
  app: import("firebase/app").FirebaseApp;
  fs: typeof import("firebase/firestore");
  db: import("firebase/firestore").Firestore;
  authMod: typeof import("firebase/auth");
  auth: import("firebase/auth").Auth;
};

let fbPromise: Promise<Fb> | null = null;
export function getFb(): Promise<Fb> {
  if (!fbPromise) {
    fbPromise = (async () => {
      const [{ initializeApp, getApps }, fs, authMod] = await Promise.all([import("firebase/app"), import("firebase/firestore"), import("firebase/auth")]);
      const app = getApps()[0] ?? initializeApp(firebaseConfig);
      return { app, fs, db: fs.getFirestore(app), authMod, auth: authMod.getAuth(app) };
    })();
  }
  return fbPromise;
}

export async function getStorageMod() {
  const [{ app }, st] = await Promise.all([getFb(), import("firebase/storage")]);
  return { st, storage: st.getStorage(app) };
}
