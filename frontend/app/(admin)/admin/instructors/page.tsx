"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Star,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface InstructorRecord {
  id: string;
  userId: string;
  bio: string | null;
  rating: number;
  reviewCount: number;
  yearsExp: number;
  licenceNumber?: string | null;
  transmission: string[];
  areas: string[];
  pricePerHour: number;
  isFemale: boolean;
  isActive: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
  };
  _count: { bookings: number };
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3 h-3",
            i < Math.round(count) ? "text-yellow-400 fill-yellow-400" : "text-brand-border fill-brand-border"
          )}
        />
      ))}
    </div>
  );
}

function InstructorRow({
  instructor,
  expanded,
  onToggleExpand,
  onToggleActive,
}: {
  instructor: InstructorRecord;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onToggleActive: (id: string, current: boolean) => void;
}) {
  return (
    <>
      <tr className="hover:bg-brand-surface/50 transition-colors">
        {/* Instructor */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-xs font-bold shrink-0">
              {getInitials(instructor.user.name)}
            </div>
            <div>
              <p className="font-semibold text-brand-black text-sm">{instructor.user.name ?? "—"}</p>
              <p className="text-xs text-brand-muted">{instructor.user.email}</p>
            </div>
          </div>
        </td>

        {/* Areas */}
        <td className="px-5 py-3.5 hidden md:table-cell">
          <div className="flex flex-wrap gap-1 max-w-[160px]">
            {instructor.areas.slice(0, 2).map((area) => (
              <span
                key={area}
                className="text-xs bg-brand-surface rounded-lg px-2 py-0.5 font-medium text-brand-muted border border-brand-border"
              >
                {area}
              </span>
            ))}
            {instructor.areas.length > 2 && (
              <span className="text-xs text-brand-muted font-medium">
                +{instructor.areas.length - 2} more
              </span>
            )}
          </div>
        </td>

        {/* Transmission */}
        <td className="px-5 py-3.5 hidden lg:table-cell">
          <div className="flex flex-wrap gap-1">
            {instructor.transmission.map((t) => (
              <span
                key={t}
                className="text-xs font-medium border border-brand-border px-2 py-0.5 rounded-lg text-brand-black"
              >
                {t}
              </span>
            ))}
          </div>
        </td>

        {/* Rating */}
        <td className="px-5 py-3.5 hidden lg:table-cell">
          <div className="flex items-center gap-1.5">
            <StarRow count={instructor.rating} />
            <span className="text-xs text-brand-muted">({Number(instructor.rating).toFixed(1)})</span>
          </div>
        </td>

        {/* Price */}
        <td className="px-5 py-3.5 text-sm font-semibold text-brand-black hidden md:table-cell whitespace-nowrap">
          £{Number(instructor.pricePerHour).toFixed(0)}/hr
        </td>

        {/* Status */}
        <td className="px-5 py-3.5 hidden sm:table-cell">
          <button
            onClick={() => onToggleActive(instructor.id, instructor.isActive)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors",
              instructor.isActive
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-brand-muted hover:bg-gray-200"
            )}
            title={instructor.isActive ? "Deactivate instructor" : "Activate instructor"}
          >
            {instructor.isActive ? (
              <>
                <Eye className="w-3 h-3" />
                Active
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3" />
                Inactive
              </>
            )}
          </button>
        </td>

        {/* Bookings */}
        <td className="px-5 py-3.5 text-sm text-brand-black font-semibold hidden lg:table-cell">
          {instructor._count.bookings}
        </td>

        {/* Expand */}
        <td className="px-5 py-3.5 text-right">
          <button
            onClick={() => onToggleExpand(instructor.id)}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors"
            title="Toggle details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={8} className="bg-brand-surface/30 border-b border-brand-border">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-8 py-4">
                  <p className="text-sm font-semibold text-brand-black mb-1">Bio</p>
                  <p className="text-sm text-brand-muted mb-4">{instructor.bio ?? "No bio provided."}</p>
                  <div className="flex flex-wrap gap-6 text-xs text-brand-muted">
                    <span>
                      Phone:{" "}
                      <strong className="text-brand-black">{instructor.user.phone ?? "—"}</strong>
                    </span>
                    <span>
                      Experience:{" "}
                      <strong className="text-brand-black">{instructor.yearsExp} yrs</strong>
                    </span>
                    {instructor.licenceNumber && (
                      <span>
                        Licence:{" "}
                        <strong className="text-brand-black font-mono">{instructor.licenceNumber}</strong>
                      </span>
                    )}
                    <span>
                      Female instructor:{" "}
                      <strong className="text-brand-black">{instructor.isFemale ? "Yes" : "No"}</strong>
                    </span>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/instructors")
      .then((r) => r.json())
      .then((d) => setInstructors(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleToggleActive(id: string, current: boolean) {
    // Optimistic update
    setInstructors((prev) =>
      prev.map((ins) => (ins.id === id ? { ...ins, isActive: !current } : ins))
    );
    try {
      await fetch("/api/admin/instructors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
    } catch {
      // Revert on error
      setInstructors((prev) =>
        prev.map((ins) => (ins.id === id ? { ...ins, isActive: current } : ins))
      );
    }
  }

  function handleToggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const filtered = search.trim()
    ? instructors.filter(
        (ins) =>
          ins.user.name?.toLowerCase().includes(search.toLowerCase()) ||
          ins.user.email.toLowerCase().includes(search.toLowerCase())
      )
    : instructors;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-brand-black">Instructors</h1>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
            <GraduationCap className="w-3.5 h-3.5" />
            {instructors.length}
          </span>
        </div>
        <Link
          href="/become-an-instructor"
          target="_blank"
          className="inline-flex items-center gap-2 bg-brand-red text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Add Instructor +
        </Link>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-3 border border-brand-border rounded-xl text-sm bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red shadow-sm"
          />
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
                  Instructor
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell">
                  Areas
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">
                  Transmission
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">
                  Rating
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell">
                  Price/hr
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden sm:table-cell">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">
                  Bookings
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-full" />
                        <div>
                          <div className="h-3 bg-gray-100 rounded w-24 mb-1.5" />
                          <div className="h-2.5 bg-gray-100 rounded w-32" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="h-5 bg-gray-100 rounded w-20" />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="h-5 bg-gray-100 rounded w-16" />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="h-4 bg-gray-100 rounded w-20" />
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="h-3 bg-gray-100 rounded w-12" />
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="h-5 bg-gray-100 rounded w-16" />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="h-3 bg-gray-100 rounded w-8" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-7 bg-gray-100 rounded w-7 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <GraduationCap className="w-10 h-10 text-brand-border mx-auto mb-3" />
                    <p className="text-brand-muted text-sm">
                      {search ? "No instructors match your search" : "No instructors found"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((instructor) => (
                  <InstructorRow
                    key={instructor.id}
                    instructor={instructor}
                    expanded={expandedId === instructor.id}
                    onToggleExpand={handleToggleExpand}
                    onToggleActive={handleToggleActive}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
