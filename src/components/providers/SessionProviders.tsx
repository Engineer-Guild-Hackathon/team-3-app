"use client";

import { SessionProvider } from "next-auth/react";

/**
 * セッションプロバイダ（App Router 全体用）
 */
export default function SessionProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

