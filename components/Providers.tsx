"use client";
import type { ReactNode } from "react";
import { LangProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { Shell } from "./Shell";

export function Providers({ children }: { children: ReactNode }) {
  return <LangProvider><AuthProvider><Shell>{children}</Shell></AuthProvider></LangProvider>;
}
