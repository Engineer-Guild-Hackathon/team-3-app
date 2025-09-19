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
  title: {
    default: "SPAR",
    template: "%s | SPAR",
  },
  description: "ChatGPT風のUIデモ",
  icons: {
    icon: "/SPAR_icon.png",
    shortcut: "/SPAR_icon.png",
    apple: "/SPAR_icon.png",
  },
  applicationName: "SPAR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProviders>{children}</SessionProviders>
      </body>
    </html>
  );
}
