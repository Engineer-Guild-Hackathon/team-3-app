// アプリ全体のルート保護（/login と /api/auth などを除く）
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const pathname = req.nextUrl.pathname;
      // 未認証でもアクセス可能なパス（静的アセット等）を許可
      // Next.js の public 配下はルート直下に展開されるため、拡張子を含むパスは除外
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico" ||
        pathname.includes("."); // 例: /SPAR_logo.png, /robots.txt など
      if (isPublic) return true;

      if (pathname.startsWith('/api/v1/')) {
        const authHeader = req.headers.get('authorization')?.toLowerCase() ?? '';
        if (authHeader.startsWith('bearer ')) {
          return true;
        }
      }

      const isApiV1 = pathname.startsWith('/api/v1/');
      if (isApiV1) {
        const authHeader = req.headers.get('authorization');
        if (authHeader?.toLowerCase().startsWith('bearer ')) return true;
      }

      return !!token;
    },
  },
});

export const config = {
  matcher: [
    // 公開ルートと静的アセットを除外
    // - /login
    // - /api/auth
    // - /_next/*
    // - ルート直下の静的ファイル（拡張子を含むもの）
    "/((?!api/auth|login|_next|favicon.ico|.*\\..*).*)",
  ],
};
