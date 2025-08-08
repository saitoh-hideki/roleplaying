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
      className={`
        nav-item group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium 
        transition-all duration-200 ease-in-out rounded-lg min-w-0
        ${isActive 
          ? 'text-blue-400 nav-item-active' 
          : 'text-slate-200 hover:text-slate-50 hover:bg-white/5 hover:-translate-y-0.5'
        }
      `}
    >
      <Icon className={`
        w-5 h-5 transition-all duration-200 flex-shrink-0
        ${isActive 
          ? 'text-blue-400 scale-110' 
          : 'text-slate-300 group-hover:text-slate-50 group-hover:scale-105'
        }
      `} />
      <span className="hidden sm:inline-block transition-all duration-200 truncate">
        {label}
      </span>
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full nav-underline" />
      )}
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
    <nav className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      {navItems.map((item, index) => (
        <div
          key={item.href}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <NavItem
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={pathname === item.href || pathname.startsWith(item.href)}
          />
        </div>
      ))}
    </nav>
  );
} 