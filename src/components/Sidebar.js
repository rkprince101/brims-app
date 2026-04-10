"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  Truck, 
  FileStack, 
  Search,
  Settings
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/work-orders", label: "Work Orders", icon: ClipboardList },
    { href: "/job-cards", label: "Job Cards", icon: FileText },
    { href: "/vep", label: "VEP Registry", icon: Truck },
    { href: "/vouchers", label: "Vouchers", icon: FileStack },
    { href: "/search", label: "Search", icon: Search },
  ];

  return (
    <aside className="w-[240px] flex-shrink-0 bg-bg-sidebar border-r border-border flex flex-col h-screen h-[100dvh] pt-4 pb-4 overflow-y-auto">
      {/* Workspace Header */}
      <div className="px-4 mb-6 flex items-center gap-2 cursor-pointer hover:bg-border/50 py-1 rounded mx-2 transition-colors">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-accent text-white font-bold text-xs">
          B
        </div>
        <div className="flex-1 overflow-hidden">
          <h2 className="text-sm font-semibold text-text-primary truncate">
            BRIMS Workspace
          </h2>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-0.5 px-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-2 py-1.5 rounded text-sm transition-colors ${
                isActive 
                  ? "bg-border text-text-primary font-medium" 
                  : "text-text-secondary hover:bg-bg-card-hover"
              }`}
            >
              <Icon size={16} className={isActive ? "text-text-primary" : "text-text-muted"} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Area */}
      <div className="px-2 mt-auto pt-4 border-t border-border mx-2">
        <Link 
          href="/settings"
          className="flex items-center gap-3 px-2 py-1.5 rounded text-sm text-text-secondary hover:bg-bg-card-hover transition-colors w-full text-left"
        >
          <Settings size={16} className="text-text-muted" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
