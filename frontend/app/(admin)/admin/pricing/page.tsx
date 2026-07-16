"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, PoundSterling, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { LessonType } from "@/types";
import { cn } from "@/lib/utils";
import { adminApiFetch } from "@/lib/admin-api";

type TestCentre = { name: string; fee: number };

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

type BlockBookingBannerForm = {
  heading: string;
  subtitle: string;
  manualPrice: string;
  manualDescription: string;
  automaticPrice: string;
  automaticDescription: string;
  savingsPrice: string;
  savingsDescription: string;
};

const DEFAULT_BANNER_FORM: BlockBookingBannerForm = {
  heading: "Reduce with Block Bookings",
  subtitle: "Book in bulk — save per lesson.",
  manualPrice: "38",
  manualDescription: "Full driving hour, all top-up lessons and learning materials included.",
  automaticPrice: "40",
  automaticDescription: "Full driving hour, all top-up lessons and learning materials included.",
  savingsPrice: "2",
  savingsDescription: "off per hour (typical block)",
};

function bannerToForm(data: Record<string, unknown>): BlockBookingBannerForm {
  return {
    heading: typeof data.heading === "string" ? data.heading : DEFAULT_BANNER_FORM.heading,
    subtitle: typeof data.subtitle === "string" ? data.subtitle : DEFAULT_BANNER_FORM.subtitle,
    manualPrice: data.manualPrice != null ? String(data.manualPrice) : DEFAULT_BANNER_FORM.manualPrice,
    manualDescription:
      typeof data.manualDescription === "string" ? data.manualDescription : DEFAULT_BANNER_FORM.manualDescription,
    automaticPrice: data.automaticPrice != null ? String(data.automaticPrice) : DEFAULT_BANNER_FORM.automaticPrice,
    automaticDescription:
      typeof data.automaticDescription === "string"
        ? data.automaticDescription
        : DEFAULT_BANNER_FORM.automaticDescription,
    savingsPrice: data.savingsPrice != null ? String(data.savingsPrice) : DEFAULT_BANNER_FORM.savingsPrice,
    savingsDescription:
      typeof data.savingsDescription === "string" ? data.savingsDescription : DEFAULT_BANNER_FORM.savingsDescription,
  };
}

async function fetchAdminCategories(): Promise<AdminCat[]> {
  const payload = (await adminApiFetch("/pricing/categories").then((r) => r.json())) as {
    data?: AdminCat[];
  };
  const categories = Array.isArray(payload?.data) ? payload.data : [];
  return categories.map((cat) => ({
    ...cat,
    packages: Array.isArray(cat?.packages) ? cat.packages : [],
  }));
}

export default function AdminPricingPage() {
  const [categories, setCategories] = useState<AdminCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [tcSaving, setTcSaving] = useState(false);
  const [theoryPrice, setTheoryPrice] = useState<string>("9.99");
  const [theoryPriceSaving, setTheoryPriceSaving] = useState(false);
  const [banner, setBanner] = useState<BlockBookingBannerForm>(DEFAULT_BANNER_FORM);
  const [bannerSaving, setBannerSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, tcRes, tpRes, bbRes] = await Promise.all([
          fetchAdminCategories(),
          adminApiFetch("/pricing/test-centres").then((r) => r.json()),
          adminApiFetch("/pricing/theory-price").then((r) => r.json()),
          adminApiFetch("/pricing/block-booking-banner").then((r) => r.json()),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setTestCentres(Array.isArray(tcRes?.data) ? tcRes.data : []);
          if (tpRes?.data?.price != null) setTheoryPrice(String(tpRes.data.price));
          if (bbRes?.data) setBanner(bannerToForm(bbRes.data));
        }
      } catch {
        if (!cancelled) toast.error("Could not load pricing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [cats, tcRes, tpRes, bbRes] = await Promise.all([
        fetchAdminCategories(),
        adminApiFetch("/pricing/test-centres").then((r) => r.json()),
        adminApiFetch("/pricing/theory-price").then((r) => r.json()),
        adminApiFetch("/pricing/block-booking-banner").then((r) => r.json()),
      ]);
      setCategories(cats);
      setTestCentres(Array.isArray(tcRes?.data) ? tcRes.data : []);
      if (tpRes?.data?.price != null) setTheoryPrice(String(tpRes.data.price));
      if (bbRes?.data) setBanner(bannerToForm(bbRes.data));
    } catch {
      toast.error("Could not load pricing.");
    } finally {
      setLoading(false);
    }
  }

  async function saveTheoryPrice() {
    setTheoryPriceSaving(true);
    try {
      await adminApiFetch("/pricing/theory-price", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(theoryPrice) || 9.99 }),
      });
      toast.success("Theory access price saved.");
    } catch {
      toast.error("Could not save theory price.");
    } finally {
      setTheoryPriceSaving(false);
    }
  }

  async function saveTestCentres() {
    setTcSaving(true);
    try {
      await adminApiFetch("/pricing/test-centres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centres: testCentres }),
      });
      toast.success("Test Day Fees saved.");
    } catch {
      toast.error("Could not save test centres.");
    } finally {
      setTcSaving(false);
    }
  }

  async function saveBlockBookingBanner() {
    setBannerSaving(true);
    try {
      await adminApiFetch("/pricing/block-booking-banner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading: banner.heading,
          subtitle: banner.subtitle,
          manualPrice: parseFloat(banner.manualPrice) || 0,
          manualDescription: banner.manualDescription,
          automaticPrice: parseFloat(banner.automaticPrice) || 0,
          automaticDescription: banner.automaticDescription,
          savingsPrice: parseFloat(banner.savingsPrice) || 0,
          savingsDescription: banner.savingsDescription,
        }),
      });
      toast.success("Block Bookings banner saved.");
    } catch {
      toast.error("Could not save Block Bookings banner.");
    } finally {
      setBannerSaving(false);
    }
  }

  async function toggleCategoryActive(id: string, isActive: boolean) {
    try {
      await adminApiFetch(`/pricing/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c))
      );
      toast.success("Category updated.");
    } catch {
      toast.error("Could not update category.");
    }
  }

  async function togglePackageActive(pkgId: string, isActive: boolean) {
    try {
      await adminApiFetch(`/pricing/packages/${pkgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          packages: c.packages.map((p) =>
            p.id === pkgId ? { ...p, isActive: !isActive } : p
          ),
        }))
      );
      toast.success("Package updated.");
    } catch {
      toast.error("Could not update package.");
    }
  }

  async function savePackage(pkg: AdminPkg) {
    try {
      await adminApiFetch(`/pricing/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      toast.success("Saved package.");
      await load();
    } catch {
      toast.error("Could not save package.");
    }
  }

  async function createPackage(categoryId: string, lessonType: LessonType) {
    try {
      await adminApiFetch("/pricing/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        categoryId,
        slug: `custom-${Date.now()}`,
        name: "New package",
        hours: 1,
        lessons: 1,
        price: 40,
        sortOrder: 99,
        isActive: true,
        }),
      });
      toast.success("Package created.");
      await load();
    } catch {
      toast.error("Could not create package.");
    }
  }

  async function removePackage(pkgId: string) {
    try {
      await adminApiFetch(`/pricing/packages/${pkgId}`, { method: "DELETE" });
      toast.success("Package deactivated.");
      await load();
    } catch {
      toast.error("Could not remove package.");
    }
  }

  return (
    <div className="w-full">
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
                      <th className="text-left px-4 py-2 font-semibold">Subtitle</th>
                      <th className="text-left px-4 py-2 font-semibold">Popular</th>
                      <th className="text-left px-4 py-2 font-semibold">Active</th>
                      <th className="text-right px-4 py-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...cat.packages].sort((a, b) => a.price - b.price).map((pkg) => (
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

          {/* ── Theory Access Price ── */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="px-5 py-4 bg-brand-surface border-b border-brand-border">
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Theory Training</p>
              <h2 className="text-lg font-bold text-brand-black">Theory-Only Access Price</h2>
              <p className="text-xs text-brand-muted mt-0.5">Shown on the Theory Training page for non-logged-in users.</p>
            </div>
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-black">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={theoryPrice}
                  onChange={(e) => setTheoryPrice(e.target.value)}
                  className="w-28 px-3 py-2 border border-brand-border rounded-lg text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => void saveTheoryPrice()}
                disabled={theoryPriceSaving}
                className="text-xs font-semibold px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-orange disabled:opacity-60"
              >
                {theoryPriceSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.section>

          {/* ── Test Day Fees ── */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="px-5 py-4 bg-brand-surface border-b border-brand-border">
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Test Day</p>
              <h2 className="text-lg font-bold text-brand-black">Test Day Fees</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-surface/80 border-b border-brand-border">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Test Centre</th>
                    <th className="text-left px-4 py-2 font-semibold">Fee (£)</th>
                    <th className="text-right px-4 py-2 font-semibold">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {testCentres.map((tc, i) => (
                    <tr key={i} className="border-b border-brand-border last:border-b-0">
                      <td className="px-4 py-3">
                        <input
                          value={tc.name}
                          onChange={(e) => setTestCentres((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                          className="w-full min-w-[140px] px-2 py-1 border border-brand-border rounded-lg text-sm"
                          placeholder="Centre name"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={tc.fee}
                          onChange={(e) => setTestCentres((prev) => prev.map((x, j) => j === i ? { ...x, fee: parseFloat(e.target.value) || 0 } : x))}
                          className="w-24 px-2 py-1 border border-brand-border rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setTestCentres((prev) => prev.filter((_, j) => j !== i))}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-brand-border bg-brand-surface/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTestCentres((prev) => [...prev, { name: "", fee: 175 }])}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:text-brand-orange"
              >
                <Plus className="w-4 h-4" /> Add centre
              </button>
              <button
                type="button"
                onClick={() => void saveTestCentres()}
                disabled={tcSaving}
                className="text-xs font-semibold px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-orange disabled:opacity-60"
              >
                {tcSaving ? "Saving…" : "Save Test Day Fees"}
              </button>
            </div>
          </motion.section>

          {/* ── Reduce with Block Bookings banner (public /prices page) ── */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="px-5 py-4 bg-brand-surface border-b border-brand-border">
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Prices Page</p>
              <h2 className="text-lg font-bold text-brand-black">Reduce with Block Bookings</h2>
              <p className="text-xs text-brand-muted mt-1">
                Controls the dark banner near the bottom of <code className="bg-white px-1 rounded">/prices</code>.
              </p>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Heading</label>
                  <input
                    value={banner.heading}
                    onChange={(e) => setBanner((prev) => ({ ...prev, heading: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Subtitle</label>
                  <input
                    value={banner.subtitle}
                    onChange={(e) => setBanner((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="border border-brand-border rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-muted mb-3">Manual Lessons</p>
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Price / hour (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={banner.manualPrice}
                    onChange={(e) => setBanner((prev) => ({ ...prev, manualPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm mb-3"
                  />
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Description</label>
                  <textarea
                    value={banner.manualDescription}
                    onChange={(e) => setBanner((prev) => ({ ...prev, manualDescription: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm resize-none"
                  />
                </div>

                <div className="border border-brand-border rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-muted mb-3">Automatic Lessons</p>
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Price / hour (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={banner.automaticPrice}
                    onChange={(e) => setBanner((prev) => ({ ...prev, automaticPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm mb-3"
                  />
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Description</label>
                  <textarea
                    value={banner.automaticDescription}
                    onChange={(e) => setBanner((prev) => ({ ...prev, automaticDescription: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm resize-none"
                  />
                </div>

                <div className="border border-brand-border rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-muted mb-3">Savings</p>
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Amount off / hour (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={banner.savingsPrice}
                    onChange={(e) => setBanner((prev) => ({ ...prev, savingsPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm mb-3"
                  />
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Description</label>
                  <textarea
                    value={banner.savingsDescription}
                    onChange={(e) => setBanner((prev) => ({ ...prev, savingsDescription: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void saveBlockBookingBanner()}
                  disabled={bannerSaving}
                  className="text-xs font-semibold px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-orange disabled:opacity-60"
                >
                  {bannerSaving ? "Saving…" : "Save Banner"}
                </button>
              </div>
            </div>
          </motion.section>
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
    <tr className="border-b border-brand-border last:border-b-0 align-middle">
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
        <input
          value={draft.footerNote ?? ""}
          onChange={(e) =>
            setDraft((d) => ({ ...d, footerNote: e.target.value || null }))
          }
          placeholder="e.g. Ideal for beginners"
          className="w-40 px-2 py-1 border border-brand-border rounded-lg text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => setDraft((d) => ({ ...d, isPopular: !d.isPopular }))}
          className={cn(
            "text-xs font-semibold px-2 py-1 rounded-lg",
            draft.isPopular ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-500"
          )}
        >
          {draft.isPopular ? "⭐ Yes" : "No"}
        </button>
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
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
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
        </div>
      </td>
    </tr>
  );
}
