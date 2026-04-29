"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Area {
  id: string;
  name: string;
  postcodePrefix: string;
  description: string;
  isActive: boolean;
}

interface AreaFormData {
  name: string;
  postcodePrefix: string;
  description: string;
  isActive: boolean;
}

const emptyForm = (): AreaFormData => ({
  name: "",
  postcodePrefix: "",
  description: "",
  isActive: true,
});

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function AreaModal({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AreaFormData) => Promise<void>;
  initial?: Area;
}) {
  const [form, setForm] = useState<AreaFormData>(
    initial
      ? {
          name: initial.name,
          postcodePrefix: initial.postcodePrefix,
          description: initial.description,
          isActive: initial.isActive,
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        postcodePrefix: initial.postcodePrefix,
        description: initial.description,
        isActive: initial.isActive,
      });
    } else {
      setForm(emptyForm());
    }
  }, [initial, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-brand-black">
              {initial ? "Edit Area" : "Add Area"}
            </h3>
            <button
              onClick={onClose}
              className="text-brand-muted hover:text-brand-black transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-black mb-1.5">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Slough Town Centre"
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-black mb-1.5">
                Postcode Prefix
              </label>
              <input
                value={form.postcodePrefix}
                onChange={(e) =>
                  setForm((f) => ({ ...f, postcodePrefix: e.target.value }))
                }
                required
                placeholder="e.g. SL1"
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-black mb-1.5">
                Description{" "}
                <span className="text-brand-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Brief description of this service area..."
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
              />
            </div>

            <div className="flex items-center gap-3 py-1">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-brand-red rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-brand-black cursor-pointer">
                Active (visible to students)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-brand-red text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : initial ? "Update Area" : "Add Area"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-brand-border rounded-xl font-semibold text-sm text-brand-black hover:bg-brand-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  async function fetchAreas() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/areas");
      if (res.ok) {
        const data = await res.json();
        setAreas(data.data ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch areas", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAreas();
  }, []);

  async function handleAddArea(data: AreaFormData) {
    const res = await fetch("/api/admin/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowModal(false);
      fetchAreas();
    }
  }

  async function handleEditArea(data: AreaFormData) {
    if (!editingArea) return;
    const res = await fetch(`/api/admin/areas/${editingArea.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowModal(false);
      setEditingArea(null);
      fetchAreas();
    }
  }

  async function handleToggleActive(area: Area) {
    const res = await fetch(`/api/admin/areas/${area.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !area.isActive }),
    });
    if (res.ok) {
      setAreas((prev) =>
        prev.map((a) => (a.id === area.id ? { ...a, isActive: !area.isActive } : a))
      );
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/areas/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAreas((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
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
          <h2 className="text-2xl font-extrabold text-brand-black">Service Areas</h2>
          <span className="inline-flex items-center gap-1.5 bg-brand-surface border border-brand-border text-brand-muted rounded-xl px-3 py-1.5 text-sm font-bold">
            <MapPin className="w-4 h-4" />
            {areas.length}
          </span>
        </div>
        <button
          onClick={() => {
            setEditingArea(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-brand-red text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Area
        </button>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 animate-pulse"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="h-5 bg-gray-100 rounded w-32" />
                <div className="h-5 bg-gray-100 rounded w-14" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-16 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : areas.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-brand-border shadow-sm p-16 text-center"
        >
          <MapPin className="w-10 h-10 text-brand-border mx-auto mb-3" />
          <p className="text-brand-muted text-sm mb-3">No service areas yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-brand-red font-semibold hover:text-brand-orange transition-colors"
          >
            Add the first area
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {areas.map((area) => (
            <motion.div
              key={area.id}
              variants={itemVariants}
              className="bg-white rounded-2xl border border-brand-border p-5 shadow-sm flex flex-col gap-3"
            >
              {/* Top row: name + toggle badge */}
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-brand-black text-sm leading-tight">{area.name}</p>
                <button
                  onClick={() => handleToggleActive(area)}
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 transition-colors cursor-pointer",
                    area.isActive
                      ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                      : "bg-red-50 text-brand-red border-red-100 hover:bg-red-100"
                  )}
                >
                  {area.isActive ? "Active" : "Inactive"}
                </button>
              </div>

              {/* Postcode prefix */}
              <div className="flex items-center gap-1.5 text-sm text-brand-muted">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono text-xs">{area.postcodePrefix}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-brand-muted leading-relaxed flex-1">
                {area.description || "No description"}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-brand-border">
                <button
                  onClick={() => {
                    setEditingArea(area);
                    setShowModal(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-brand-black hover:bg-brand-surface px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>

                <div className="ml-auto">
                  {deleteConfirmId === area.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-brand-muted">Delete?</span>
                      <button
                        onClick={() => handleDelete(area.id)}
                        className="text-xs px-2.5 py-1 bg-brand-red text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs text-brand-muted hover:text-brand-black"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(area.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-brand-red hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AreaModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingArea(null);
        }}
        onSubmit={editingArea ? handleEditArea : handleAddArea}
        initial={editingArea ?? undefined}
      />
    </motion.div>
  );
}
