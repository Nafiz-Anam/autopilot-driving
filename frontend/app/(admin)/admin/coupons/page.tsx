"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Tag, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "PERCENT" as "PERCENT" | "FIXED",
    value: "",
    maxDiscountAmount: "",
    minOrderAmount: "",
    maxRedemptions: "",
  });

  async function load() {
    setLoading(true);
    try {
      const { data } = await axios.get<{ data: CouponRow[] }>("/api/admin/coupons");
      setCoupons(data.data);
    } catch {
      setMsg({ type: "err", text: "Could not load coupons." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await axios.patch(`/api/admin/coupons/${id}`, { isActive: !isActive });
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c)));
    } catch {
      setMsg({ type: "err", text: "Could not update coupon." });
    }
  }

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const value = parseFloat(form.value);
      if (!Number.isFinite(value) || value <= 0) {
        setMsg({ type: "err", text: "Enter a valid value." });
        return;
      }
      await axios.post("/api/admin/coupons", {
        code: form.code.trim(),
        name: form.name.trim() || undefined,
        type: form.type,
        value,
        maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : null,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions, 10) : null,
        isActive: true,
      });
      setMsg({ type: "ok", text: "Coupon created." });
      setShowForm(false);
      setForm({
        code: "",
        name: "",
        type: "PERCENT",
        value: "",
        maxDiscountAmount: "",
        minOrderAmount: "",
        maxRedemptions: "",
      });
      await load();
    } catch {
      setMsg({ type: "err", text: "Could not create (duplicate code?)." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black flex items-center gap-2">
            <Tag className="w-7 h-7 text-brand-red" />
            Booking coupons
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Promo codes for the lesson checkout flow (validated with gift vouchers in{" "}
            <code className="text-xs bg-brand-surface px-1 rounded">/api/promotions/validate</code>).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
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
            msg.type === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
          )}
        >
          {msg.text}
        </div>
      )}

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={createCoupon}
          className="bg-white border border-brand-border rounded-2xl p-6 mb-8 shadow-sm space-y-4"
        >
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
              <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Max uses (optional)</label>
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
                Max discount £ (percent only, optional)
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
              <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Min order £ (optional)</label>
              <input
                type="number"
                step="0.01"
                value={form.minOrderAmount}
                onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-brand-border rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-brand-border rounded-xl text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </button>
          </div>
        </motion.form>
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
