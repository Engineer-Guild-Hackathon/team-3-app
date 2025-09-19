"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";

import { getValidAccessToken, invalidateStoredTokens } from "@/lib/auth/web-appjwt";

type AppJwtContextValue = {
  ready: boolean;
};

const AppJwtContext = createContext<AppJwtContextValue>({ ready: false });

export function useAppJwt() {
  return useContext(AppJwtContext);
}

/**
 * NextAuth セッション（Cookie）と AppJWT（/api/v1 用 Bearer）を橋渡しするプロバイダ。
 * - ログイン完了時に AppJWT を発行し、ローカルストレージへ保存
 * - ログアウト時/ユーザー切替時にはローカルのトークンを破棄
 */
export default function AppJwtProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const bootstrappedRef = useRef(false);
  const lastUserRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const userKey = session?.user ? String((session.user as any)?.id ?? session.user.email ?? "") : null;

    // ユーザーが切り替わった場合はローカルのトークンを破棄
    if (status === "authenticated" && lastUserRef.current && userKey && lastUserRef.current !== userKey) {
      invalidateStoredTokens();
      bootstrappedRef.current = false;
      setReady(false);
    }

    if (status === "authenticated") {
      lastUserRef.current = userKey ?? null;
      if (bootstrappedRef.current) {
        setReady(true);
        return;
      }
      bootstrappedRef.current = true;
      setReady(false);

      let cancelled = false;
      (async () => {
        try {
          const token = await getValidAccessToken(true);
          if (cancelled) return;
          if (!token) {
            console.warn("[AppJwtProvider] Failed to acquire AppJWT token");
            setReady(false);
            return;
          }
          setReady(true);
        } catch (error) {
          if (!cancelled) {
            console.error("[AppJwtProvider] AppJWT bootstrap failed", error);
            await signOut({ callbackUrl: "/login" });
            setReady(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (status === "unauthenticated") {
      lastUserRef.current = null;
      bootstrappedRef.current = false;
      invalidateStoredTokens();
      setReady(false);
    }
  }, [status, session]);

  const value = useMemo<AppJwtContextValue>(() => ({ ready }), [ready]);

  return <AppJwtContext.Provider value={value}>{children}</AppJwtContext.Provider>;
}
