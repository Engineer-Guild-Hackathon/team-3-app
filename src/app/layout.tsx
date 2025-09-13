import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionProviders from "@/components/providers/SessionProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Team3 Chat UI",
  description: "ChatGPT風のUIデモ",
  // タブに表示されるアイコン（日本語コメント）
  icons: {
    icon: "/SPAR_icon.png",
    shortcut: "/SPAR_icon.png",
    apple: "/SPAR_icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* タブのアイコンを明示（ブラウザキャッシュ回避のためクエリ付与） */}
        <link rel="icon" href="/SPAR_icon.png?v=2" sizes="any" type="image/png" />
        <link rel="apple-touch-icon" href="/SPAR_icon.png?v=2" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProviders>{children}</SessionProviders>
      </body>
    </html>
  );
}
