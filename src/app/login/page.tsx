import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import LoginClient from "@/components/auth/LoginClient";

/**
 * ログインページ（Google ログインのみ）
 * - 将来的に Entra(EID) へ切替予定
 */
export default async function LoginPage() {
  // サーバー側で既にログイン済みならトップにリダイレクト
  const session = await getServerSession(authOptions);
  if (session) redirect("/");
  return <LoginClient />;
}
