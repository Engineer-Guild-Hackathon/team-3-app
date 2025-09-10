// アプリ全体のルート保護（/login と /api/auth などを除く）
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const pathname = req.nextUrl.pathname;
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico" ||
        pathname.startsWith("/public");
      if (isPublic) return true;
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    // 公開ルートと静的アセットを除外
    "/((?!api/auth|login|_next|favicon.ico|public).*)",
  ],
};
