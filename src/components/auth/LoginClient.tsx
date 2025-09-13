"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import LoginScreen from "@/components/spar/LoginScreen";

/**
 * ログインページ（SPAR UI 完全再現）
 */
export default function LoginClient() {
  const [hasGoogle, setHasGoogle] = useState<boolean | null>(null);
  useEffect(() => {
    getProviders().then((ps) => setHasGoogle(!!ps?.google)).catch(() => setHasGoogle(false));
  }, []);

  const onGoogle = () => signIn("google", { callbackUrl: "/" });

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* 背景のアニメ要素（ChatApp と同系統）*/}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="relative z-10 h-full">
        <LoginScreen
          onGoogleLogin={onGoogle}
          disabled={hasGoogle === false}
          errorText={hasGoogle === false ? "認証プロバイダが未設定です。管理者にお問い合わせください。" : null}
        />
      </div>
    </div>
  );
}
