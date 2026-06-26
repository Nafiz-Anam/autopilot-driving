"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tag, Loader2, Plus, X, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApiFetch } from "@/lib/admin-api";
import toast from "react-hot-toast";

interface CouponRow {
  id: string;
  code: string;
  name: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  isActive: boolean;
}

const emptyForm = {
  code: "",
  name: "",
  type: "PERCENT" as "PERCENT" | "FIXED",
  value: "",
  maxDiscountAmount: "",
  minOrderAmount: "",
  maxRedemptions: "",
};

function CouponModal({
  open,
  editingCoupon,
  onClose,
  onSaved,
}: {
  open: boolean;
  editingCoupon: CouponRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErr(null);
      setForm(
        editingCoupon
          ? {
              code: editingCoupon.code,
              name: editingCoupon.name ?? "",
              type: editingCoupon.type,
              value: String(editingCoupon.value),
              maxDiscountAmount: editingCoupon.maxDiscountAmount != null ? String(editingCoupon.maxDiscountAmount) : "",
              minOrderAmount: editingCoupon.minOrderAmount != null ? String(editingCoupon.minOrderAmount) : "",
              maxRedemptions: editingCoupon.maxRedemptions != null ? String(editingCoupon.maxRedemptions) : "",
            }
          : emptyForm
      );
    }
  }, [open, editingCoupon]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const value = parseFloat(form.value);
      if (!Number.isFinite(value) || value <= 0) {
        setErr("Enter a valid value.");
        return;
      }
      const body = {
        code: form.code.trim(),
        name: form.name.trim() || undefined,
        type: form.type,
        value,
        maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : null,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions, 10) : null,
        isActive: true,
      };
      if (editingCoupon) {
        await adminApiFetch(`/coupons/${editingCoupon.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await adminApiFetch("/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      toast.success(editingCoupon ? "Coupon updated" : "Coupon created");
      onSaved();
      onClose();
    } catch {
      setErr(editingCoupon ? "Could not update coupon." : "Could not create (duplicate code?).");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-black">
                  {editingCoupon ? "Edit coupon" : "New coupon"}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {err && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {err}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Code</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="mt-1 w-full px-3 py-2 border border-brand-border rounded-xl text-sm"
                    placeholder="SUMMER20"
                    maxLength={32}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Label (optional)</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-brand-border rounded-xl text-sm"
                    placeholder="Summer promotion"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PERCENT" | "FIXED" }))}
                    className="mt-1 w-full px-3 py-2 border border-brand-border rounded-xl text-sm"
                  >
                    <option value="PERCENT">Percent off</option>
                    <option value="FIXED">Fixed £ off</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
                    {form.type === "PERCENT" ? "Percent (e.g. 10)" : "Amount (£)"}
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-brand-border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Max uses</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxRedemptions}
                    onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-brand-border rounded-xl text-sm"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
                    Max discount £ (% only)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-brand-border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Min order £</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-brand-border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-brand-border rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCoupon ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const payload = (await adminApiFetch("/coupons").then((r) => r.json())) as {
        data?: CouponRow[];
      };
      setCoupons(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setMsg({ type: "err", text: "Could not load coupons." });
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await adminApiFetch(`/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c)));
      toast.success("Coupon status updated");
    } catch {
      toast.error("Failed to update coupon");
    }
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await adminApiFetch(`/coupons/${id}`, { method: "DELETE" });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Coupon deleted");
    } catch {
      toast.error("Failed to delete coupon");
    } finally {
      setDeletingId(null);
    }
  }

  function openNew() {
    setEditingCoupon(null);
    setModalOpen(true);
  }

  function openEdit(coupon: CouponRow) {
    setEditingCoupon(coupon);
    setModalOpen(true);
  }

  return (
    <div className="w-full">
      <CouponModal
        open={modalOpen}
        editingCoupon={editingCoupon}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          void load();
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black flex items-center gap-2">
            <Tag className="w-7 h-7 text-brand-red" />
            Booking coupons
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Promo codes for the lesson checkout flow.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-red text-white rounded-xl font-semibold text-sm hover:bg-brand-orange"
        >
          <Plus className="w-4 h-4" />
          New coupon
        </button>
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

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
          </div>
        ) : coupons.length === 0 ? (
          <p className="text-center text-brand-muted py-16 text-sm">No coupons yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-surface border-b border-brand-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-brand-black">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-black">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-black">Value</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-black">Used</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-black">Active</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-brand-border last:border-b-0">
                    <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                    <td className="px-4 py-3 text-brand-muted">{c.type}</td>
                    <td className="px-4 py-3">
                      {c.type === "PERCENT" ? `${c.value}%` : `£${c.value}`}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">
                      {c.redemptionCount}
                      {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(c.id, c.isActive)}
                        className={cn(
                          "text-xs font-semibold px-2 py-1 rounded-lg",
                          c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {c.isActive ? "Active" : "Off"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteCoupon(c.id)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg text-brand-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
