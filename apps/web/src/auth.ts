// 認証設定（next-auth v4 + Google）
// - JWT セッション戦略
// - ドメイン制限（任意）：環境変数 ALLOWED_EMAIL_DOMAIN で許可ドメインを指定

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { resolveUserIdByEmail } from "@/lib/auth/user";

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

function isProbablyUuid(value: unknown): boolean {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
    async jwt({ token, account, profile, user }) {
      // いずれかのソースからメールアドレスを特定し、常にアプリ内 UUID を sub に設定する
      const emailFromToken = typeof token.email === "string" ? token.email : undefined;
      const emailFromProfile = typeof (profile as any)?.email === "string" ? (profile as any).email : undefined;
      const emailFromUser = typeof (user as any)?.email === "string" ? (user as any).email : undefined;
      const displayName =
        typeof (profile as any)?.name === "string"
          ? (profile as any).name
          : typeof (user as any)?.name === "string"
            ? (user as any).name
            : undefined;

      const resolvedEmail = emailFromToken ?? emailFromProfile ?? emailFromUser;
      const needsResolution = account != null || typeof token.sub !== 'string' || !isProbablyUuid(token.sub);

      if (resolvedEmail && needsResolution) {
        const userId = await resolveUserIdByEmail(resolvedEmail, displayName);
        if (userId) {
          token.sub = userId;
        }
      }
      return token;
    },
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
