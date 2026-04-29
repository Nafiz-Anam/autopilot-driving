"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  User,
  Clock,
  Users,
  LogOut,
  ChevronRight,
  ChevronDown,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const studentNav: NavItem[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/bookings", label: "My Bookings", icon: CalendarDays },
  { href: "/student/theory", label: "Theory Training", icon: BookOpen },
  { href: "/student/profile", label: "Profile", icon: User },
];

const instructorNav: NavItem[] = [
  { href: "/instructor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/instructor/schedule", label: "Schedule", icon: Clock },
  { href: "/instructor/students", label: "My Students", icon: Users },
];

const pageTitles: Record<string, string> = {
  "/student/dashboard": "Dashboard",
  "/student/bookings": "My Bookings",
  "/student/theory": "Theory Training",
  "/student/profile": "Profile",
  "/instructor/dashboard": "Dashboard",
  "/instructor/schedule": "My Schedule",
  "/instructor/students": "My Students",
};

function AutopilotLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="34" height="34" rx="10" fill="#E8200A" />
        <path
          d="M17 7L27 26H7L17 7Z"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <circle cx="17" cy="20" r="2.5" fill="white" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-white font-black text-sm tracking-widest uppercase">
          AutoPilot
        </span>
        <span className="text-white/40 text-[9px] tracking-[0.2em] uppercase">
          Driving School
        </span>
      </div>
    </Link>
  );
}

function SidebarContent({
  navLinks,
  session,
  onLinkClick,
}: {
  navLinks: NavItem[];
  session: ReturnType<typeof useSession>["data"];
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
  const role = (session?.user as { role?: string })?.role ?? "STUDENT";

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <AutopilotLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
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
                  layoutId="sidebar-active"
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

    </div>
  );
}

function MobileSidebar({
  open,
  onClose,
  navLinks,
  session,
}: {
  open: boolean;
  onClose: () => void;
  navLinks: NavItem[];
  session: ReturnType<typeof useSession>["data"];
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
            <SidebarContent
              navLinks={navLinks}
              session={session}
              onLinkClick={onClose}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function TopHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const title =
    Object.entries(pageTitles).find(([key]) =>
      pathname.startsWith(key)
    )?.[1] ?? "Dashboard";

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
  const role = (session?.user as { role?: string })?.role ?? "STUDENT";
  const profileHref = role === "INSTRUCTOR" ? "/instructor/dashboard" : "/student/profile";

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

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-brand-surface transition-colors"
          >
            <div className="w-7 h-7 bg-brand-red rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <span className="text-sm font-medium text-brand-black hidden sm:block">
              {session?.user?.name?.split(" ")[0]}
            </span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-brand-muted transition-transform hidden sm:block", dropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-brand-border z-40 overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-brand-border">
                    <p className="text-sm font-semibold text-brand-black truncate">{session?.user?.name ?? "User"}</p>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-surface text-brand-muted">
                      {role}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href={profileHref}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-black hover:bg-brand-surface transition-colors"
                    >
                      <User className="w-4 h-4 text-brand-muted" />
                      View Profile
                    </Link>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = (session?.user as { role?: string })?.role;
  const navLinks = role === "INSTRUCTOR" ? instructorNav : studentNav;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (status === "authenticated" && role === "ADMIN") {
      router.replace("/admin/dashboard");
      return;
    }
  }, [status, role, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-brand-muted">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-brand-surface">
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-60 bg-brand-black z-30 hidden lg:block">
        <SidebarContent navLinks={navLinks} session={session} />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navLinks={navLinks}
        session={session}
      />

      {/* Main content */}
      <div className="lg:ml-60 min-h-screen flex flex-col">
        <TopHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
