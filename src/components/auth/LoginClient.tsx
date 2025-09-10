"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

/**
 * ログインページのクライアントUI
 * - Google プロバイダの有無でボタン表示を切替
 */
export default function LoginClient() {
  const [hasGoogle, setHasGoogle] = useState<boolean | null>(null);

  useEffect(() => {
    getProviders()
      .then((ps) => setHasGoogle(!!ps?.google))
      .catch(() => setHasGoogle(false));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">ログイン</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Google アカウントでログインしてください。
          </p>
        </div>

        {hasGoogle === null ? (
          <div className="text-center text-sm text-black/60 dark:text-white/60">読み込み中...</div>
        ) : hasGoogle ? (
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10"
          >
            Google でログイン
          </button>
        ) : (
          <div className="text-center text-sm text-red-600 dark:text-red-400">
            認証プロバイダが未設定です。管理者にお問い合わせください。
          </div>
        )}
      </div>
    </div>
  );
}

