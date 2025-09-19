"use client";

import { SessionProvider } from "next-auth/react";

import AppJwtProvider from "@/components/providers/AppJwtProvider";

/**
 * セッションプロバイダ（App Router 全体用）
 */
export default function SessionProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppJwtProvider>{children}</AppJwtProvider>
    </SessionProvider>
  );
}
