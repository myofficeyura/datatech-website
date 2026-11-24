"use client";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Firebase açarları yoxdursa sayt "demo rejimində" işləyir: məlumat brauzerdə saxlanır. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
export function fb(): { app: FirebaseApp; auth: Auth; db: Firestore } | null {
  if (!firebaseEnabled || typeof window === "undefined") return null;
  app = getApps()[0] ?? initializeApp(config);
  return { app, auth: getAuth(app), db: getFirestore(app) };
}

export const ALLOWED_DOMAIN = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "").replace(/^@/, "").toLowerCase();
export const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export function isAllowedEmail(email?: string | null) {
  if (!email) return false;
  if (!ALLOWED_DOMAIN) return true;
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return true; // admin başqa domendən ola bilər
  return email.toLowerCase().endsWith("@" + ALLOWED_DOMAIN) || email.toLowerCase().endsWith("." + ALLOWED_DOMAIN);
}
