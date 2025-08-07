'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mic, History, Settings, Theater } from "lucide-react";

// ナビゲーションアイテムコンポーネント
function NavItem({ href, label, icon: Icon, isActive }: { 
  href: string; 
  label: string; 
  icon: any; 
  isActive: boolean;
}) {
  return (
    <Link 
      href={href}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive 
          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-sm' 
          : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );
}

// ナビゲーションコンポーネント
export function Navigation() {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
    { href: "/scenes", label: "シーン", icon: Theater },
    { href: "/record", label: "録音", icon: Mic },
    { href: "/history", label: "履歴", icon: History },
    { href: "/admin/scenarios", label: "シーン管理", icon: Settings },
  ];

  return (
    <nav className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-xl p-2 shadow-lg">
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={pathname === item.href || pathname.startsWith(item.href)}
        />
      ))}
    </nav>
  );
} 