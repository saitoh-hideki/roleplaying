import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/ui/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "接客ロープレ SaaS",
  description: "接客スタッフ向けの社員研修用ロールプレイアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-black`}
      >
        <header className="h-14 bg-black text-white shadow-md flex items-center justify-between px-6 z-50 border-b border-slate-800">
          {/* ロゴ / タイトル */}
          <div className="text-lg font-bold tracking-tight select-none">
            🖤 接客ロープレ
          </div>

          {/* ナビゲーション */}
          <Navigation />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
