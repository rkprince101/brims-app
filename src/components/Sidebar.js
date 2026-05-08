"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  Truck, 
  FileStack, 
  Search,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  LogOut,
  User
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (collapsed) {
      document.documentElement.classList.add("sidebar-collapsed");
    } else {
      document.documentElement.classList.remove("sidebar-collapsed");
    }
  }, [collapsed]);

  // Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.username);
        }
      } catch {
        // silently fail — middleware handles redirects
      }
    }
    fetchUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      // force redirect anyway
      router.push("/login");
    }
  }

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/work-orders", label: "Work Orders", icon: ClipboardList },
    { href: "/job-cards", label: "Job Cards", icon: FileText },
    { href: "/vep", label: "VEP Registry", icon: Truck },
    { href: "/units", label: "Units", icon: Building2 },
    { href: "/vouchers", label: "Vouchers", icon: FileStack },
    { href: "/crv-rv", label: "Global CRV / RV", icon: FileStack },
    { href: "/search", label: "Search", icon: Search },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex-shrink-0 bg-bg-sidebar border-r border-border flex flex-col h-screen pt-4 pb-4 overflow-hidden transition-all duration-200 ${
        collapsed ? "w-[52px]" : "w-[240px]"
      }`}
    >
      {/* Workspace Header */}
      <div className={`px-2 mb-4 flex items-center ${collapsed ? "justify-center" : "justify-between"} mx-2`}>
        {!collapsed && (
          <div className="flex items-center gap-2 cursor-pointer hover:bg-border/50 py-1 rounded px-2 transition-colors flex-1 overflow-hidden">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-accent text-white font-bold text-xs">
              B
            </div>
            <h2 className="text-sm font-semibold text-text-primary truncate">
              BRIMS Workspace
            </h2>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded hover:bg-border/60 text-text-muted hover:text-text-primary transition-colors ${collapsed ? "" : "flex-shrink-0"}`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className={`flex-1 ${collapsed ? "px-1" : "space-y-0.5 px-2"}`}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <div key={link.href} className={`relative group ${collapsed ? "flex justify-center" : ""}`}>
              <Link
                href={link.href}
                className={`flex items-center gap-3 rounded text-sm transition-colors ${
                  collapsed ? "justify-center p-2.5" : "px-2 py-1.5"
                } ${
                  isActive
                    ? "bg-border text-text-primary font-medium"
                    : "text-text-secondary hover:bg-bg-card-hover"
                }`}
              >
                <Icon size={16} className={`flex-shrink-0 ${isActive ? "text-text-primary" : "text-text-muted"}`} />
                {!collapsed && link.label}
              </Link>
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-text-primary text-bg-card text-xs font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-sm">
                  {link.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Area */}
      <div className={`px-2 mt-auto pt-4 border-t border-border mx-2 ${collapsed ? "flex flex-col items-center gap-1" : "space-y-1"}`}>
        {/* Current User */}
        {currentUser && (
          <div className={`relative group ${collapsed ? "flex justify-center" : ""}`}>
            <div
              className={`flex items-center gap-3 rounded text-sm text-text-secondary ${
                collapsed ? "justify-center p-2.5" : "px-2 py-1.5"
              }`}
            >
              <User size={16} className="flex-shrink-0 text-text-muted" />
              {!collapsed && (
                <span className="truncate text-text-muted text-xs font-medium">
                  {currentUser}
                </span>
              )}
            </div>
            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-text-primary text-bg-card text-xs font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-sm">
                {currentUser}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <div className={`relative group ${collapsed ? "flex justify-center" : ""}`}>
          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded text-sm text-text-secondary hover:bg-bg-card-hover transition-colors ${
              collapsed ? "justify-center p-2.5" : "px-2 py-1.5 w-full text-left"
            }`}
          >
            <Settings size={16} className="flex-shrink-0 text-text-muted" />
            {!collapsed && "Settings"}
          </Link>
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-text-primary text-bg-card text-xs font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-sm">
              Settings
            </div>
          )}
        </div>

        {/* Logout */}
        <div className={`relative group ${collapsed ? "flex justify-center" : ""}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 rounded text-sm text-text-secondary hover:bg-danger-bg hover:text-danger transition-colors ${
              collapsed ? "justify-center p-2.5" : "px-2 py-1.5 w-full text-left"
            }`}
          >
            <LogOut size={16} className="flex-shrink-0 text-text-muted" />
            {!collapsed && "Logout"}
          </button>
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-text-primary text-bg-card text-xs font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-sm">
              Logout
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

