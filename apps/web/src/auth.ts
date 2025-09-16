// 認証設定（next-auth v4 + Google）
// - JWT セッション戦略
// - ドメイン制限（任意）：環境変数 ALLOWED_EMAIL_DOMAIN で許可ドメインを指定

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// 開発環境では NEXTAUTH_SECRET が未設定でも動作させるためのフォールバック（要確認）
// 本番（production）では .env/Key Vault で NEXTAUTH_SECRET を必ず設定してください。
const devFallbackSecret =
  process.env.NODE_ENV !== "production" ? "__dev_insecure_secret__" : undefined;

const providers: NextAuthOptions["providers"] = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? devFallbackSecret,
  providers,
  pages: {
    // 未認証時のリダイレクト先
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, profile }) {
      // 1) 個別メール許可（カンマ区切り）。設定がある場合は最優先で適用
      const allowedEmails = (process.env.ALLOWED_EMAILS || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const email = (user?.email || (profile as any)?.email || "").toLowerCase();

      if (allowedEmails.length > 0) {
        return email ? allowedEmails.includes(email) : false;
      }

      // 2) ドメイン許可（フォールバック）
      const allowDomain = process.env.ALLOWED_EMAIL_DOMAIN?.toLowerCase();
      if (!allowDomain) return true;
      if (!email) return false;
      const domain = email.split("@")[1];
      return domain === allowDomain;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};
