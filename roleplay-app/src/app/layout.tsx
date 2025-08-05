import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
        <header className="h-16 bg-slate-800 text-white flex items-center px-6 justify-between shadow-lg border-b border-slate-700">
          <div className="text-xl font-bold tracking-wide">🖤 接客ロープレ</div>
          <nav className="flex space-x-8 text-sm">
            <a className="text-white hover:text-indigo-300 transition-colors font-medium" href="/dashboard">ダッシュボード</a>
            <a className="text-white hover:text-indigo-300 transition-colors font-medium" href="/record">録音</a>
            <a className="text-white hover:text-indigo-300 transition-colors font-medium" href="/history">履歴</a>
            <a className="text-white hover:text-indigo-300 transition-colors font-medium" href="/admin/scenarios">管理</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
