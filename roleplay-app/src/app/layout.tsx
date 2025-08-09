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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0f172a]`}
      >
        <header className="h-16 bg-[#0F172A]/95 backdrop-blur-sm text-white shadow-lg flex items-center justify-between px-6 z-50 border-b border-[#334155]">
          {/* ロゴ / タイトル */}
          <div className="text-xl font-bold tracking-tight select-none text-slate-50">
            接客ロープレ
          </div>

          {/* ナビゲーション */}
          <Navigation />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
