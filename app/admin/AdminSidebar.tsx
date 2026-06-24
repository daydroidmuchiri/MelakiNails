"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  ClipboardList,
  Package,
  Tag,
  Settings,
  ExternalLink,
  Menu,
  X,
  Store,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: ShoppingBag,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: Layers,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ClipboardList,
  },
  {
    name: "Inventory",
    href: "/admin/inventory",
    icon: Package,
  },
  {
    name: "Promotions",
    href: "/admin/promotions",
    icon: Tag,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  userEmail: string;
  userName?: string;
  children: React.ReactNode;
}

function getInitials(email: string, name?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.charAt(0).toUpperCase();
}

export default function AdminSidebar({ userEmail, userName, children }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const initials = getInitials(userEmail, userName);

  const handleLogout = () => {
    signOut({ callbackUrl: "/admin/login" });
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-charcoal-400 shrink-0">
        <Link href="/products" className="flex items-center gap-2">
          <Store className="w-5 h-5 text-amber" />
          <span className="font-display text-xl font-bold tracking-tight text-white">
            MELAKI <span className="text-amber">Admin</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-amber text-white font-semibold"
                  : "text-charcoal-100 hover:text-white hover:bg-charcoal-400"
              )}
            >
              <Icon className={cn("w-4 h-4", active ? "text-white" : "text-amber")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer — user info + storefront link */}
      <div className="shrink-0 border-t border-charcoal-400">
        <Link
          href="/products"
          className="flex items-center gap-2 px-7 py-3 text-xs font-medium text-charcoal-100 hover:text-white hover:bg-charcoal-400 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Storefront
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* ───────── Desktop Sidebar ───────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-charcoal text-white shrink-0 shadow-sidebar">
        <SidebarContent />
      </aside>

      {/* ───────── Mobile Drawer ───────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-charcoal/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="relative flex flex-col w-64 max-w-xs bg-charcoal text-white h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-charcoal-100 hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ───────── Main content wrapper ───────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          {/* Left: hamburger + page title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-charcoal hover:bg-cream rounded-lg"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-charcoal capitalize">
              {pathname === "/admin"
                ? "Dashboard"
                : pathname.split("/").slice(2).join(" / ") || "Admin"}
            </h1>
          </div>

          {/* Right: user menu */}
          <div className="relative">
            <button
              id="admin-user-menu"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-cream transition-colors"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
              {/* Email — hidden on very small screens */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-charcoal leading-none">
                  {userName ?? "Administrator"}
                </span>
                <span className="text-xs text-muted leading-none mt-0.5 max-w-[160px] truncate">
                  {userEmail}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-muted transition-transform duration-150",
                  userMenuOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <>
                {/* Backdrop to close on outside click */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-border z-20 overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs font-semibold text-charcoal truncate">
                      {userName ?? "Administrator"}
                    </p>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {userEmail}
                    </p>
                  </div>
                  {/* Logout */}
                  <button
                    id="admin-logout-btn"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}
