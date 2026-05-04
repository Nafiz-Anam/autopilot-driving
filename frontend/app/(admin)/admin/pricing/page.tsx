"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Loader2, PoundSterling, Plus, Trash2 } from "lucide-react";
import type { LessonType } from "@prisma/client";
import { cn } from "@/lib/utils";

type AdminPkg = {
  id: string;
  slug: string;
  name: string;
  hours: number;
  lessons: number;
  price: number;
  pricePerHour: number | null;
  pricePerLesson: number;
  savings: number | null;
  footerNote: string | null;
  badge: string | null;
  isPopular: boolean;
  sortOrder: number;
  isActive: boolean;
};

type AdminCat = {
  id: string;
  lessonType: LessonType;
  slug: string;
  displayName: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  packages: AdminPkg[];
};

async function fetchAdminCategories(): Promise<AdminCat[]> {
  const { data } = await axios.get<{ data: AdminCat[] }>("/api/admin/pricing/categories");
  return data.data;
}

export default function AdminPricingPage() {
  const [categories, setCategories] = useState<AdminCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdminCategories();
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) setMsg({ type: "err", text: "Could not load pricing." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      setCategories(await fetchAdminCategories());
    } catch {
      setMsg({ type: "err", text: "Could not load pricing." });
    } finally {
      setLoading(false);
    }
  }

  async function toggleCategoryActive(id: string, isActive: boolean) {
    try {
      await axios.patch(`/api/admin/pricing/categories/${id}`, { isActive: !isActive });
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c))
      );
      setMsg({ type: "ok", text: "Category updated." });
    } catch {
      setMsg({ type: "err", text: "Could not update category." });
    }
  }

  async function togglePackageActive(pkgId: string, isActive: boolean) {
    try {
      await axios.patch(`/api/admin/pricing/packages/${pkgId}`, { isActive: !isActive });
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          packages: c.packages.map((p) =>
            p.id === pkgId ? { ...p, isActive: !isActive } : p
          ),
        }))
      );
      setMsg({ type: "ok", text: "Package updated." });
    } catch {
      setMsg({ type: "err", text: "Could not update package." });
    }
  }

  async function savePackage(pkg: AdminPkg) {
    setMsg(null);
    try {
      await axios.patch(`/api/admin/pricing/packages/${pkg.id}`, {
        name: pkg.name,
        hours: pkg.hours,
        lessons: pkg.lessons,
        price: pkg.price,
        pricePerHour: pkg.pricePerHour,
        savings: pkg.savings,
        footerNote: pkg.footerNote,
        badge: pkg.badge,
        isPopular: pkg.isPopular,
        sortOrder: pkg.sortOrder,
      });
      setMsg({ type: "ok", text: "Saved package." });
      await load();
    } catch {
      setMsg({ type: "err", text: "Could not save package." });
    }
  }

  async function createPackage(categoryId: string, lessonType: LessonType) {
    setMsg(null);
    try {
      await axios.post("/api/admin/pricing/packages", {
        categoryId,
        slug: `custom-${Date.now()}`,
        name: "New package",
        hours: 1,
        lessons: 1,
        price: 40,
        sortOrder: 99,
        isActive: true,
      });
      setMsg({ type: "ok", text: "Package created." });
      await load();
    } catch {
      setMsg({ type: "err", text: "Could not create package." });
    }
  }

  async function removePackage(pkgId: string) {
    if (!confirm("Deactivate this package?")) return;
    try {
      await axios.delete(`/api/admin/pricing/packages/${pkgId}`);
      setMsg({ type: "ok", text: "Package deactivated." });
      await load();
    } catch {
      setMsg({ type: "err", text: "Could not remove package." });
    }
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-brand-black flex items-center gap-2">
          <PoundSterling className="w-7 h-7 text-brand-red" />
          Lesson pricing
        </h1>
        <p className="text-sm text-brand-muted mt-1">
          Changes apply immediately on the public site (
          <code className="text-xs bg-brand-surface px-1 rounded">/prices</code>, lesson pages, booking
          checkout). Amounts at payment are taken from the package record, not the client.
        </p>
      </div>

      {msg && (
        <div
          className={cn(
            "mb-4 px-4 py-3 rounded-xl text-sm",
            msg.type === "ok"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          )}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
        </div>
      ) : (
        <div className="space-y-10">
          {categories.map((cat) => (
            <motion.section
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="px-5 py-4 bg-brand-surface border-b border-brand-border flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
                    {cat.lessonType}
                  </p>
                  <h2 className="text-lg font-bold text-brand-black">{cat.displayName}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleCategoryActive(cat.id, cat.isActive)}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg",
                    cat.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {cat.isActive ? "Category active" : "Category off"}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-brand-surface/80 border-b border-brand-border">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold">Name</th>
                      <th className="text-left px-4 py-2 font-semibold">£</th>
                      <th className="text-left px-4 py-2 font-semibold">Hrs</th>
                      <th className="text-left px-4 py-2 font-semibold">Lsns</th>
                      <th className="text-left px-4 py-2 font-semibold">£/hr (disp.)</th>
                      <th className="text-left px-4 py-2 font-semibold">Save</th>
                      <th className="text-left px-4 py-2 font-semibold">Active</th>
                      <th className="text-right px-4 py-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.packages.map((pkg) => (
                      <PackageEditorRow
                        key={pkg.id}
                        pkg={pkg}
                        onSave={(p) => void savePackage(p)}
                        onToggleActive={() => void togglePackageActive(pkg.id, pkg.isActive)}
                        onRemove={() => void removePackage(pkg.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 border-t border-brand-border bg-brand-surface/50">
                <button
                  type="button"
                  onClick={() => void createPackage(cat.id, cat.lessonType)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:text-brand-orange"
                >
                  <Plus className="w-4 h-4" />
                  Add package to this category
                </button>
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}

function PackageEditorRow({
  pkg,
  onSave,
  onToggleActive,
  onRemove,
}: {
  pkg: AdminPkg;
  onSave: (p: AdminPkg) => void;
  onToggleActive: () => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(pkg);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setDraft(pkg);
    });
    return () => cancelAnimationFrame(id);
  }, [pkg]);

  return (
    <tr className="border-b border-brand-border last:border-b-0 align-top">
      <td className="px-4 py-3">
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="w-full min-w-[120px] px-2 py-1 border border-brand-border rounded-lg text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={draft.price}
          onChange={(e) =>
            setDraft((d) => ({ ...d, price: parseFloat(e.target.value) || 0 }))
          }
          className="w-24 px-2 py-1 border border-brand-border rounded-lg text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={draft.hours}
          onChange={(e) =>
            setDraft((d) => ({ ...d, hours: parseInt(e.target.value, 10) || 0 }))
          }
          className="w-16 px-2 py-1 border border-brand-border rounded-lg text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={draft.lessons}
          onChange={(e) =>
            setDraft((d) => ({ ...d, lessons: parseInt(e.target.value, 10) || 0 }))
          }
          className="w-16 px-2 py-1 border border-brand-border rounded-lg text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={draft.pricePerHour ?? ""}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              pricePerHour: e.target.value === "" ? null : parseFloat(e.target.value),
            }))
          }
          className="w-20 px-2 py-1 border border-brand-border rounded-lg text-sm"
          placeholder="auto"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={draft.savings ?? ""}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              savings: e.target.value === "" ? null : parseFloat(e.target.value),
            }))
          }
          className="w-16 px-2 py-1 border border-brand-border rounded-lg text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onToggleActive}
          className={cn(
            "text-xs font-semibold px-2 py-1 rounded-lg",
            pkg.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
          )}
        >
          {pkg.isActive ? "On" : "Off"}
        </button>
      </td>
      <td className="px-4 py-3 text-right space-x-2">
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="text-xs font-semibold px-3 py-1.5 bg-brand-red text-white rounded-lg hover:bg-brand-orange"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
        >
          <Trash2 className="w-3 h-3" /> Remove
        </button>
      </td>
    </tr>
  );
}
