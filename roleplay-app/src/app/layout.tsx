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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">接客ロープレ</h1>
              <div className="flex gap-4">
                <a href="/dashboard" className="text-gray-600 hover:text-gray-900">ダッシュボード</a>
                <a href="/record" className="text-gray-600 hover:text-gray-900">録音</a>
                <a href="/history" className="text-gray-600 hover:text-gray-900">履歴</a>
                <a href="/admin/scenarios" className="text-gray-600 hover:text-gray-900">管理</a>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
