"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
  _count: { bookings: number };
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

const roleBadgeClasses: Record<string, string> = {
  STUDENT: "bg-blue-50 text-blue-700",
  INSTRUCTOR: "bg-green-100 text-green-700",
  ADMIN: "bg-red-50 text-brand-red",
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleDropdownId, setRoleDropdownId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debounced fetch
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      fetch(`/api/admin/users?${params}`)
        .then((r) => r.json())
        .then((d) => {
          setUsers(d.data ?? []);
          setTotal(d.total ?? 0);
          setTotalPages(d.totalPages ?? 1);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, roleFilter, page]);

  async function handleRoleChange(id: string, role: string) {
    // Optimistic update
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    setRoleDropdownId(null);
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
    } catch {
      // Revert on error by refetching isn't critical for demo
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setTotal((t) => t - 1);
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-brand-black">Users</h1>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Users className="w-3.5 h-3.5" />
            {total} total
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or email..."
              className="border border-brand-border rounded-xl pl-9 pr-4 py-2 text-sm w-64 focus:outline-none focus:border-brand-red bg-white"
            />
          </div>
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="border border-brand-border rounded-xl px-3 py-2 text-sm bg-white text-brand-black focus:outline-none focus:border-brand-red"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface border-b border-brand-border">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Name / Email
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Role
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell">
                  Phone
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">
                  Joined
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">
                  Bookings
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full" />
                        <div>
                          <div className="h-3 bg-gray-100 rounded w-24 mb-1.5" />
                          <div className="h-2.5 bg-gray-100 rounded w-36" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="h-5 bg-gray-100 rounded w-20" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-3 bg-gray-100 rounded w-24" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><div className="h-3 bg-gray-100 rounded w-20" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><div className="h-3 bg-gray-100 rounded w-8" /></td>
                    <td className="px-5 py-4"><div className="h-7 bg-gray-100 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Users className="w-10 h-10 text-brand-border mx-auto mb-3" />
                    <p className="text-brand-muted text-sm">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-brand-surface/50 transition-colors"
                    onClick={() => {
                      if (roleDropdownId === user.id) setRoleDropdownId(null);
                    }}
                  >
                    {/* Name/Email */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-xs font-bold shrink-0">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-black text-sm">{user.name ?? "—"}</p>
                          <p className="text-xs text-brand-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <div className="relative flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full",
                            roleBadgeClasses[user.role] ?? "bg-gray-100 text-brand-muted"
                          )}
                        >
                          {user.role}
                        </span>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoleDropdownId((prev) => (prev === user.id ? null : user.id));
                            }}
                            className="text-xs px-2 py-1 border border-brand-border rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors"
                          >
                            Change Role
                          </button>
                          {roleDropdownId === user.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => { e.stopPropagation(); setRoleDropdownId(null); }}
                              />
                              <div className="absolute left-0 top-full mt-1 bg-white border border-brand-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[110px]">
                                {["STUDENT", "INSTRUCTOR", "ADMIN"].map((r) => (
                                  <button
                                    key={r}
                                    onClick={(e) => { e.stopPropagation(); handleRoleChange(user.id, r); }}
                                    className={cn(
                                      "flex items-center w-full px-3 py-2 text-xs font-medium hover:bg-brand-surface transition-colors",
                                      user.role === r ? "text-brand-red font-bold" : "text-brand-black"
                                    )}
                                  >
                                    {r.charAt(0) + r.slice(1).toLowerCase()}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-3.5 text-sm text-brand-muted hidden md:table-cell">
                      {user.phone ?? "—"}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 text-sm text-brand-muted hidden lg:table-cell whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Bookings */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-sm font-bold text-brand-black bg-brand-surface rounded-lg px-2 py-0.5">
                        {user._count.bookings}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                        disabled={deletingId === user.id}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-brand-red hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-brand-border flex items-center justify-between">
          <p className="text-xs text-brand-muted">
            Page {page} of {totalPages} &middot; {total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
