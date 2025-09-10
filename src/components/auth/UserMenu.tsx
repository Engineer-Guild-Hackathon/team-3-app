"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

/**
 * ユーザーメニュー（ログアウト）
 * - 認証済: ユーザー表示 + ログアウトボタン
 * - 未認証: ログインリンク
 */
export default function UserMenu() {
  const { data, status } = useSession();

  // ローディング中は何も表示しない
  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <Link
        href="/login"
        className="text-xs text-black/60 dark:text-white/60 hover:underline"
      >
        ログイン
      </Link>
    );
  }

  const name = data?.user?.name ?? "";
  const email = data?.user?.email ?? "";

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex flex-col items-end leading-tight">
        {name && <span className="text-sm truncate max-w-[12rem]">{name}</span>}
        {email && (
          <span className="text-[11px] text-black/60 dark:text-white/60 truncate max-w-[12rem]">
            {email}
          </span>
        )}
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10"
        title="ログアウト"
        aria-label="ログアウト"
      >
        ログアウト
      </button>
    </div>
  );
}

