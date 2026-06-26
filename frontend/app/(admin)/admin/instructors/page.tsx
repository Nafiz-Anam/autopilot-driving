"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Search, GraduationCap, Eye, EyeOff, Plus, Pencil, Trash2, X, Check, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApiFetch } from "@/lib/admin-api";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface InstructorRecord {
  id: string;
  userId: string;
  bio: string | null;

  reviewCount: number;
  yearsExp: number;
  licenceNumber?: string | null;
  transmission: string[];
  areas: string[];
  pricePerHour: number;
  isFemale: boolean;
  isActive: boolean;
  user: { id: string; name: string | null; email: string; phone: string | null; image: string | null };
  _count: { bookings: number };
}

interface InstructorFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  bio: string;
  pricePerHour: string;
  transmission: string[];
  yearsExp: string;
  licenceNumber: string;
  isFemale: boolean;
  areas: string;
  isActive: boolean;
}

const emptyForm: InstructorFormData = {
  name: "", email: "", phone: "", password: "", bio: "", pricePerHour: "",
  transmission: [], yearsExp: "", licenceNumber: "", isFemale: false, areas: "", isActive: true,
};

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } } };

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}


// ── Schedule types & constants ────────────────────────────────────────────────
type CellState = "available" | "unavailable";
type AvailabilityGrid = Record<string, CellState>;
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, "0") + ":00");
const DAY_TO_INDEX: Record<string, number> = { Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6,Sunday:0 };
const INDEX_TO_DAY: Record<number, string> = { 0:"Sunday",1:"Monday",2:"Tuesday",3:"Wednesday",4:"Thursday",5:"Friday",6:"Saturday" };
function buildDefaultGrid(): AvailabilityGrid {
  const grid: AvailabilityGrid = {};
  for (const day of DAYS) for (const hour of HOURS) {
    const h = parseInt(hour);
    grid[`${day}-${hour}`] = day !== "Sunday" && h >= 8 && h < 21 ? "available" : "unavailable";
  }
  return grid;
}

function InstructorModal({
  open, editInstructor, onClose, onSaved,
}: {
  open: boolean;
  editInstructor: InstructorRecord | null;
  onClose: () => void;
  onSaved: (instructor: InstructorRecord, isNew: boolean) => void;
}) {
  const [form, setForm] = useState<InstructorFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "schedule">("profile");
  const [grid, setGrid] = useState<AvailabilityGrid>(buildDefaultGrid);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loadSchedule = useCallback(async (id: string) => {
    setScheduleLoading(true);
    try {
      const res = await adminApiFetch(`/instructors/${id}/schedule`);
      if (res.ok) {
        const json = await res.json();
        const slots: Array<{ dayOfWeek: number; startTime: string; isAvailable: boolean }> = json.data ?? [];
        const emptyGrid = buildDefaultGrid();
        Object.keys(emptyGrid).forEach((k) => (emptyGrid[k] = "unavailable"));
        if (slots.length > 0) {
          for (const slot of slots) {
            const day = INDEX_TO_DAY[slot.dayOfWeek];
            if (!day) continue;
            const hour = slot.startTime.slice(0, 5);
            const key = `${day}-${hour}`;
            if (key in emptyGrid) emptyGrid[key] = slot.isAvailable ? "available" : "unavailable";
          }
        }
        setGrid(emptyGrid);
      }
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setError("");
      setActiveTab("profile");
      setForm(
        editInstructor
          ? {
              name: editInstructor.user.name ?? "",
              email: editInstructor.user.email,
              phone: editInstructor.user.phone ?? "",
              password: "",
              bio: editInstructor.bio ?? "",
              pricePerHour: String(editInstructor.pricePerHour),
              transmission: editInstructor.transmission ?? [],
              yearsExp: String(editInstructor.yearsExp),
              licenceNumber: editInstructor.licenceNumber ?? "",
              isFemale: editInstructor.isFemale,
              areas: (editInstructor.areas ?? []).join(", "),
              isActive: editInstructor.isActive,
            }
          : emptyForm
      );
      if (editInstructor) loadSchedule(editInstructor.id);
    }
  }, [open, editInstructor, loadSchedule]);

  if (!open) return null;

  function set<K extends keyof InstructorFormData>(k: K, v: InstructorFormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function toggleTransmission(t: string) {
    setForm((p) => ({
      ...p,
      transmission: p.transmission.includes(t) ? p.transmission.filter((x) => x !== t) : [...p.transmission, t],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const areas = form.areas.split(",").map((s) => s.trim()).filter(Boolean);
      const body: Record<string, unknown> = {
        bio: form.bio || null,
        pricePerHour: Number(form.pricePerHour) || 0,
        transmission: form.transmission,
        yearsExp: Number(form.yearsExp) || 0,
        licenceNumber: form.licenceNumber || null,
        isFemale: form.isFemale,
        areas,
        isActive: form.isActive,
      };

      let res: Response;
      if (editInstructor) {
        Object.assign(body, { name: form.name, email: form.email, phone: form.phone || null });
        res = await adminApiFetch(`/instructors/${editInstructor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        Object.assign(body, { name: form.name, email: form.email, phone: form.phone || null, password: form.password });
        res = await adminApiFetch("/instructors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error ?? json.message ?? "Failed to save"); return; }

      const updated: InstructorRecord = editInstructor
        ? {
            ...editInstructor,
            bio: form.bio || null,
            pricePerHour: Number(form.pricePerHour) || 0,
            transmission: form.transmission,
            yearsExp: Number(form.yearsExp) || 0,
            licenceNumber: form.licenceNumber || null,
            isFemale: form.isFemale,
            areas: form.areas.split(",").map((s) => s.trim()).filter(Boolean),
            isActive: form.isActive,
            user: { ...editInstructor.user, name: form.name, email: form.email, phone: form.phone || null },
          }
        : {
            id: json.data.id,
            userId: json.data.userId ?? "",
            bio: form.bio || null,
            reviewCount: 0,
            yearsExp: Number(form.yearsExp) || 0,
            licenceNumber: form.licenceNumber || null,
            transmission: form.transmission,
            areas: form.areas.split(",").map((s) => s.trim()).filter(Boolean),
            pricePerHour: Number(form.pricePerHour) || 0,
            isFemale: form.isFemale,
            isActive: form.isActive,
            user: { id: "", name: form.name, email: form.email, phone: form.phone || null, image: null },
            _count: { bookings: 0 },
          };

      onSaved(updated, !editInstructor);
      toast.success(editInstructor ? "Instructor updated" : "Instructor created");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSchedule() {
    if (!editInstructor) return;
    setScheduleSaving(true);
    try {
      const slots = Object.entries(grid).map(([key, state]) => {
        const [day, hour] = key.split(/-(?=\d{2}:)/);
        const [h] = hour.split(":").map(Number);
        const endHour = String((h + 1) % 24).padStart(2, "0");
        return { dayOfWeek: DAY_TO_INDEX[day] ?? 1, startTime: `${hour}:00`, endTime: `${endHour}:00:00`, isAvailable: state === "available" };
      });
      const res = await adminApiFetch(`/instructors/${editInstructor.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? "Failed to save schedule");
        return;
      }
      toast.success("Schedule saved");
    } finally {
      setScheduleSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-brand-border max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="text-lg font-bold text-brand-black">{editInstructor ? "Edit Instructor" : "Add Instructor"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {editInstructor && (
          <div className="flex border-b border-brand-border shrink-0 px-6">
            {(["profile", "schedule"] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={cn("px-4 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px",
                  activeTab === tab ? "border-brand-red text-brand-red" : "border-transparent text-brand-muted hover:text-brand-black")}>
                {tab}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto" style={{ display: activeTab === "profile" ? undefined : "none" }}>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

          <p className="text-xs font-bold text-brand-muted uppercase tracking-wide">Account</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1">Name *</label>
              <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
            {!editInstructor && (
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Password *</label>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-black transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
          <hr className="border-brand-border" />
          <p className="text-xs font-bold text-brand-muted uppercase tracking-wide">Instructor Profile</p>

          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1">Bio</label>
            <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1">Price / hr (£)</label>
              <input type="number" min="0" step="1" value={form.pricePerHour} onChange={(e) => set("pricePerHour", e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1">Years Experience</label>
              <input type="number" min="0" value={form.yearsExp} onChange={(e) => set("yearsExp", e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1">Licence Number</label>
            <input value={form.licenceNumber} onChange={(e) => set("licenceNumber", e.target.value)}
              className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-2">Transmission</label>
            <div className="flex gap-3">
              {["manual", "automatic"].map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.transmission.includes(t)} onChange={() => toggleTransmission(t)}
                    className="w-4 h-4 accent-brand-red rounded" />
                  <span className="capitalize text-brand-black">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1">Areas (comma-separated postcodes)</label>
            <input value={form.areas} onChange={(e) => set("areas", e.target.value)} placeholder="SL1, SL2, RG1"
              className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isFemale} onChange={(e) => set("isFemale", e.target.checked)}
                className="w-4 h-4 accent-brand-red rounded" />
              <span className="text-brand-black">Female instructor</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)}
                className="w-4 h-4 accent-brand-red rounded" />
              <span className="text-brand-black">Active</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-brand-border rounded-xl text-sm font-semibold text-brand-muted hover:bg-brand-surface transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-semibold hover:bg-brand-orange transition-colors disabled:opacity-60">
              {saving ? "Saving…" : editInstructor ? "Save Changes" : "Add Instructor"}
            </button>
          </div>
        </form>

        {/* ── Schedule tab panel ── */}
        {editInstructor && activeTab === "schedule" && (
          <div className="p-6 overflow-y-auto flex-1">
            {scheduleLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-brand-border">
                  <table className="w-full text-xs border-collapse" style={{ minWidth: 500 }}>
                    <thead>
                      <tr>
                        <th className="sticky left-0 bg-brand-surface px-3 py-2.5 text-left font-semibold text-brand-muted w-16 border-b border-brand-border">Time</th>
                        {DAYS.map((d) => (
                          <th key={d} className="px-1.5 py-2.5 text-center font-semibold text-brand-black bg-brand-surface border-b border-brand-border whitespace-nowrap">
                            {d.slice(0, 3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HOURS.map((hour, rowIdx) => (
                        <tr key={hour} className={cn("border-t border-brand-border/50", rowIdx % 2 === 0 ? "bg-white" : "bg-brand-surface/30")}>
                          <td className="sticky left-0 bg-inherit px-3 py-1 font-medium text-brand-muted whitespace-nowrap">{hour}</td>
                          {DAYS.map((day) => {
                            const key = `${day}-${hour}`;
                            const isAvail = grid[key] === "available";
                            return (
                              <td key={day} className="px-1 py-1">
                                <button type="button"
                                  onClick={() => setGrid((p) => ({ ...p, [key]: p[key] === "available" ? "unavailable" : "available" }))}
                                  className={cn("w-full h-8 rounded-lg border-2 transition-all flex items-center justify-center",
                                    isAvail ? "bg-green-100 border-green-300 text-green-700 hover:bg-green-200" : "bg-white border-brand-border hover:border-brand-red hover:bg-red-50")}>
                                  {isAvail && <Check className="w-3 h-3" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-4 text-xs text-brand-muted">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-100 border-2 border-green-300 rounded inline-block" /> Available</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-white border-2 border-brand-border rounded inline-block" /> Unavailable</span>
                  </div>
                  <button type="button" onClick={handleSaveSchedule} disabled={scheduleSaving}
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 bg-brand-red text-white hover:bg-brand-orange disabled:opacity-60">
                    {scheduleSaving ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : "Save Schedule"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InstructorDetailsModal({ instructor, onClose }: { instructor: InstructorRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-brand-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-lg font-bold text-brand-black">Instructor Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-lg font-bold shrink-0">
              {getInitials(instructor.user.name)}
            </div>
            <div>
              <p className="font-bold text-brand-black text-base">{instructor.user.name ?? "—"}</p>
              <p className="text-sm text-brand-muted">{instructor.user.email}</p>
              {instructor.user.phone && <p className="text-sm text-brand-muted">{instructor.user.phone}</p>}
            </div>
          </div>
          <hr className="border-brand-border" />
          {instructor.bio && (
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-1">Bio</p>
              <p className="text-sm text-brand-black leading-relaxed">{instructor.bio}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-0.5">Experience</p>
              <p className="font-semibold text-brand-black">{instructor.yearsExp} yrs</p>
            </div>
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-0.5">Price / hr</p>
              <p className="font-semibold text-brand-black">£{Number(instructor.pricePerHour).toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-0.5">Licence</p>
              <p className="font-semibold text-brand-black font-mono">{instructor.licenceNumber ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-0.5">Female instructor</p>
              <p className="font-semibold text-brand-black">{instructor.isFemale ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-0.5">Transmission</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {instructor.transmission.map((t) => (
                  <span key={t} className="text-xs font-medium border border-brand-border px-2 py-0.5 rounded-lg text-brand-black capitalize">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-0.5">Bookings</p>
              <p className="font-semibold text-brand-black">{instructor._count.bookings}</p>
            </div>
          </div>
          {instructor.areas.length > 0 && (
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-1.5">Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {instructor.areas.map((area) => (
                  <span key={area} className="text-xs bg-brand-surface rounded-lg px-2 py-0.5 font-medium text-brand-muted border border-brand-border">{area}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InstructorRow({
  instructor, onToggleActive, onEdit, onDelete, onDetails,
}: {
  instructor: InstructorRecord;
  onToggleActive: (id: string, current: boolean) => void;
  onEdit: (instructor: InstructorRecord) => void;
  onDelete: (id: string) => void;
  onDetails: (instructor: InstructorRecord) => void;
}) {
  return (
    <tr className="hover:bg-brand-surface/50 transition-colors">
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
      <td className="px-5 py-3.5 hidden md:table-cell">
        <div className="flex flex-wrap gap-1 max-w-[160px]">
          {instructor.areas.slice(0, 2).map((area) => (
            <span key={area} className="text-xs bg-brand-surface rounded-lg px-2 py-0.5 font-medium text-brand-muted border border-brand-border">{area}</span>
          ))}
          {instructor.areas.length > 2 && <span className="text-xs text-brand-muted font-medium">+{instructor.areas.length - 2} more</span>}
        </div>
      </td>
      <td className="px-5 py-3.5 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {instructor.transmission.map((t) => (
            <span key={t} className="text-xs font-medium border border-brand-border px-2 py-0.5 rounded-lg text-brand-black">{t}</span>
          ))}
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm font-semibold text-brand-black hidden md:table-cell whitespace-nowrap">
        £{Number(instructor.pricePerHour).toFixed(0)}/hr
      </td>
      <td className="px-5 py-3.5 hidden sm:table-cell">
        <button onClick={() => onToggleActive(instructor.id, instructor.isActive)}
          className={cn("flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors",
            instructor.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-brand-muted hover:bg-gray-200")}>
          {instructor.isActive ? <><Eye className="w-3 h-3" />Active</> : <><EyeOff className="w-3 h-3" />Inactive</>}
        </button>
      </td>
      <td className="px-5 py-3.5 text-sm text-brand-black font-semibold hidden lg:table-cell">{instructor._count.bookings}</td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => onDetails(instructor)}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors" title="View details">
            <Info className="w-4 h-4" />
          </button>
          <button onClick={() => onEdit(instructor)}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors" title="Edit instructor">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(instructor.id)}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-red hover:bg-red-50 transition-colors" title="Delete instructor">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorRecord | null>(null);
  const [detailsInstructor, setDetailsInstructor] = useState<InstructorRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function fetchInstructors() {
    setLoading(true);
    adminApiFetch("/instructors")
      .then((r) => r.json())
      .then((d) => setInstructors(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchInstructors(); }, []);

  async function handleToggleActive(id: string, current: boolean) {
    setInstructors((prev) => prev.map((ins) => ins.id === id ? { ...ins, isActive: !current } : ins));
    try {
      await adminApiFetch(`/instructors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
    } catch {
      setInstructors((prev) => prev.map((ins) => ins.id === id ? { ...ins, isActive: current } : ins));
      toast.error("Failed to update status");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await adminApiFetch(`/instructors/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInstructors((prev) => prev.filter((ins) => ins.id !== id));
        toast.success("Instructor deleted");
      }
    } catch {
      toast.error("Failed to delete");
    }
    finally { setDeletingId(null); setConfirmDeleteId(null); }
  }

  function handleSaved(instructor: InstructorRecord, isNew: boolean) {
    if (isNew) {
      setInstructors((prev) => [instructor, ...prev]);
    } else {
      setInstructors((prev) => prev.map((ins) => ins.id === instructor.id ? instructor : ins));
    }
    setModalOpen(false);
    setEditingInstructor(null);
  }

  const filtered = search.trim()
    ? instructors.filter((ins) => ins.user.name?.toLowerCase().includes(search.toLowerCase()) || ins.user.email.toLowerCase().includes(search.toLowerCase()))
    : instructors;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <InstructorModal
        open={modalOpen}
        editInstructor={editingInstructor}
        onClose={() => { setModalOpen(false); setEditingInstructor(null); }}
        onSaved={handleSaved}
      />
      {detailsInstructor && (
        <InstructorDetailsModal
          instructor={detailsInstructor}
          onClose={() => setDetailsInstructor(null)}
        />
      )}
      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete instructor?"
        message="This removes the instructor profile. Their user account will remain and can be reassigned."
        confirmLabel="Delete"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-brand-black">Instructors</h1>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
            <GraduationCap className="w-3.5 h-3.5" />{instructors.length}
          </span>
        </div>
        <button onClick={() => { setEditingInstructor(null); setModalOpen(true); }}
          className="inline-flex items-center gap-2 bg-brand-red text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-red-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Instructor
        </button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-3 border border-brand-border rounded-xl text-sm bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red shadow-sm" />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface border-b border-brand-border">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide">Instructor</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell">Areas</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">Transmission</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell">Price/hr</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">Bookings</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-brand-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-gray-100 rounded-full" /><div><div className="h-3 bg-gray-100 rounded w-24 mb-1.5" /><div className="h-2.5 bg-gray-100 rounded w-32" /></div></div></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-5 bg-gray-100 rounded w-20" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><div className="h-5 bg-gray-100 rounded w-16" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-3 bg-gray-100 rounded w-12" /></td>
                    <td className="px-5 py-4 hidden sm:table-cell"><div className="h-5 bg-gray-100 rounded w-16" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><div className="h-3 bg-gray-100 rounded w-8" /></td>
                    <td className="px-5 py-4"><div className="h-7 bg-gray-100 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <GraduationCap className="w-10 h-10 text-brand-border mx-auto mb-3" />
                    <p className="text-brand-muted text-sm">{search ? "No instructors match your search" : "No instructors found"}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((instructor) => (
                  <InstructorRow
                    key={instructor.id}
                    instructor={instructor}
                    onToggleActive={handleToggleActive}
                    onEdit={(ins) => { setEditingInstructor(ins); setModalOpen(true); }}
                    onDelete={setConfirmDeleteId}
                    onDetails={setDetailsInstructor}
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
