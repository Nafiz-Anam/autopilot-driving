"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  BookOpen,
  MapPin,
  FileText,
  MessageSquare,
  CreditCard,
  Tag,
  PoundSterling,
  ChevronRight,
  ChevronDown,
  Bell,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AutopilotLogo } from "@/components/brand/AutopilotLogo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/instructors", label: "Instructors", icon: GraduationCap },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/pricing", label: "Lesson pricing", icon: PoundSterling },
  { href: "/admin/theory", label: "Theory Bank", icon: BookOpen },
  { href: "/admin/areas", label: "Service Areas", icon: MapPin },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/contact", label: "Contact", icon: MessageSquare },
];

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "Users",
  "/admin/instructors": "Instructors",
  "/admin/bookings": "Bookings",
  "/admin/payments": "Payment Settings",
  "/admin/coupons": "Coupons",
  "/admin/pricing": "Lesson pricing",
  "/admin/theory": "Theory Bank",
  "/admin/areas": "Service Areas",
  "/admin/applications": "Applications",
  "/admin/contact": "Contact",
};

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <AutopilotLogo size="compact" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {adminNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                active
                  ? "bg-brand-red text-white shadow-lg shadow-red-900/30"
                  : "text-white/55 hover:text-white hover:bg-white/8"
              )}
            >
              {active && (
                <motion.div
                  layoutId="admin-sidebar-active"
                  className="absolute inset-0 bg-brand-red rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="w-4 h-4 shrink-0 relative z-10" />
              <span className="relative z-10">{label}</span>
              {active && (
                <ChevronRight className="ml-auto w-3.5 h-3.5 relative z-10 opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/8">
        <p className="text-[11px] leading-relaxed text-white/35 text-center">
          © {new Date().getFullYear()} Autopilot Driving School
        </p>
      </div>
    </div>
  );
}

function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="fixed top-0 left-0 h-full w-64 bg-brand-black z-50 lg:hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent onLinkClick={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function TopHeader({
  user,
  onMenuClick,
}: {
  user: { name: string; email: string };
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const title =
    Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] ?? "Admin";

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 bg-white border-b border-brand-border px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-brand-black">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="relative p-2 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-brand-surface transition-colors"
          >
            <div className="w-7 h-7 bg-brand-red rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <span className="text-sm font-medium text-brand-black hidden sm:block">
              {user.name.split(" ")[0]}
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-brand-muted transition-transform hidden sm:block",
                dropdownOpen && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-brand-border z-40 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-brand-border">
                    <p className="text-sm font-semibold text-brand-black truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-brand-muted truncate mb-1">{user.email}</p>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-red-50 text-brand-red">
                      ADMIN
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-surface">
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-60 bg-brand-black z-30 hidden lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content */}
      <div className="lg:ml-60 min-h-screen flex flex-col">
        <TopHeader user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
