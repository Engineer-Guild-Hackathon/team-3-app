"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

/**
 * プロフィール表示用パネル（メイン領域用）
 * - 左サイドバーは ChatApp が描画
 */
export default function ProfilePane() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="mx-auto w-full max-w-lg px-6 md:px-8">
        <h1 className="text-2xl font-semibold mb-4">プロフィール</h1>

        <div className="flex items-center gap-4 mb-6">
          {user?.image ? (
            <Image
              src={user.image}
              alt="avatar"
              width={64}
              height={64}
              className="rounded-full border border-black/10 dark:border-white/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-black/10 dark:bg-white/10" />
          )}
          <div className="min-w-0">
            <div className="text-lg font-medium truncate">{user?.name ?? ""}</div>
            <div className="text-sm text-black/60 dark:text-white/60 truncate">{user?.email ?? ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

