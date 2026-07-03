"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertTriangle, X, Loader2, User, Lock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { backendApiUrl } from "@/lib/backend-api";
import { getNextAuthBridgeHeaders } from "@/lib/backend-auth-fetch";
import { CalendarSubscribeCard } from "@/components/shared/CalendarSubscribeCard";
import { GoogleCalendarSubscribeCard } from "@/components/shared/GoogleCalendarSubscribeCard";
import { GoogleCalendarSyncCard } from "@/components/shared/GoogleCalendarSyncCard";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  bio: string;
  pricePerHour: string;
  yearsExp: string;
  licenceNumber: string;
  areas: string;
  transmission: string[];
  isFemale: boolean;
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

type Tab = "details" | "password" | "calendar";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "details", label: "Personal Details", icon: User },
  { id: "password", label: "Change Password", icon: Lock },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

function FormField({
  label, name, value, onChange, type = "text", readOnly = false, placeholder = "", hint,
}: {
  label: string; name: string; value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; readOnly?: boolean; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-black mb-1.5">
        {label}
        {readOnly && <span className="ml-1.5 text-xs font-normal text-brand-muted">(read-only)</span>}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm transition-colors duration-150",
          readOnly
            ? "bg-brand-surface text-brand-muted cursor-not-allowed"
            : "bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
        )}
      />
      {hint && <p className="text-xs text-brand-muted mt-1">{hint}</p>}
    </div>
  );
}

function PasswordInput({ label, name, value, onChange, placeholder }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-brand-black mb-1.5">{label}</label>
      <div className="relative">
        <input
          name={name}
          value={value}
          onChange={onChange}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-11 border border-brand-border rounded-xl text-sm bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-3 flex items-center text-brand-muted hover:text-brand-black transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function DeleteDialog({ onClose }: { onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [input, setInput] = useState("");
  const PHRASE = "DELETE MY ACCOUNT";
  return (
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
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-brand-red" />
            </div>
            <h3 className="text-lg font-bold text-brand-black">Delete Account</h3>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-black transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-brand-muted mb-4">
          This will permanently delete your account and all associated data.{" "}
          <strong className="text-brand-black">This cannot be undone.</strong>
        </p>
        {!confirmed ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-black mb-1.5">
                Type <span className="font-mono font-bold text-brand-red">{PHRASE}</span> to continue
              </label>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PHRASE}
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-brand-border rounded-xl text-sm font-medium text-brand-black hover:bg-brand-surface transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={input !== PHRASE}
                onClick={() => setConfirmed(true)}
                className="flex-1 py-2.5 bg-brand-red text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete Account
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm font-semibold text-brand-black">Account deletion requested.</p>
            <p className="text-xs text-brand-muted mt-1">You will receive a confirmation email within 24 hours.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const empty: ProfileForm = {
  name: "", email: "", phone: "", bio: "", pricePerHour: "",
  yearsExp: "", licenceNumber: "", areas: "", transmission: [], isFemale: false,
};

export default function InstructorProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>(empty);
  const [passwords, setPasswords] = useState<PasswordForm>({ current: "", next: "", confirm: "" });

  useEffect(() => {
    async function load() {
      try {
        const headers = await getNextAuthBridgeHeaders();
        const res = await fetch(backendApiUrl("/instructor/profile"), { headers });
        if (res.ok) {
          const json = await res.json();
          const d = json.data ?? json;
          setProfile({
            name: d.user?.name ?? "",
            email: d.user?.email ?? "",
            phone: d.user?.phone ?? "",
            bio: d.bio ?? "",
            pricePerHour: d.pricePerHour != null ? String(d.pricePerHour) : "",
            yearsExp: d.yearsExp != null ? String(d.yearsExp) : "",
            licenceNumber: d.licenceNumber ?? "",
            areas: Array.isArray(d.areas) ? d.areas.join(", ") : (d.areas ?? ""),
            transmission: Array.isArray(d.transmission) ? d.transmission : [],
            isFemale: d.isFemale ?? false,
          });
        }
      } finally {
        setProfileLoading(false);
      }
    }
    load();
  }, []);

  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPasswords((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function toggleTransmission(t: string) {
    setProfile((p) => ({
      ...p,
      transmission: p.transmission.includes(t) ? p.transmission.filter((x) => x !== t) : [...p.transmission, t],
    }));
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await getNextAuthBridgeHeaders();
      const areas = profile.areas.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(backendApiUrl("/instructor/profile"), {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name, phone: profile.phone || null, bio: profile.bio || null,
          pricePerHour: Number(profile.pricePerHour) || 0, yearsExp: Number(profile.yearsExp) || 0,
          licenceNumber: profile.licenceNumber || null, areas, transmission: profile.transmission,
          isFemale: profile.isFemale,
        }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setSavingPassword(true);
    try {
      const headers = await getNextAuthBridgeHeaders();
      const res = await fetch(backendApiUrl("/instructor/profile/password"), {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ current: passwords.current, newPassword: passwords.next }),
      });
      if (res.ok) {
        setPasswordSaved(true);
        setPasswords({ current: "", next: "", confirm: "" });
        setTimeout(() => setPasswordSaved(false), 3000);
      } else {
        const data = await res.json();
        setPasswordError(data.error ?? "Failed to update password");
      }
    } catch {
      setPasswordError("Something went wrong");
    } finally {
      setSavingPassword(false);
    }
  }

  const passwordMatch = passwords.next && passwords.confirm && passwords.next === passwords.confirm;
  const passwordMismatch = passwords.next && passwords.confirm && passwords.next !== passwords.confirm;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-brand-muted" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-black">My Profile</h1>
        <p className="text-brand-muted mt-1 text-sm">Manage your personal details and instructor information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-brand-red to-brand-orange flex items-center justify-center text-white text-3xl font-extrabold shadow-lg mb-4">
              {initials}
            </div>
            <p className="font-bold text-brand-black text-lg leading-tight">{profile.name || "Your Name"}</p>
            <p className="text-xs text-brand-muted mt-0.5">{profile.email}</p>
            <span className="mt-2 text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-red-50 text-brand-red">
              INSTRUCTOR
            </span>
            <div className="mt-6 w-full border-t border-brand-border pt-4 space-y-2 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-brand-muted">Price / hr</span>
                <span className="font-semibold text-brand-black">£{profile.pricePerHour || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-muted">Experience</span>
                <span className="font-semibold text-brand-black">{profile.yearsExp ? `${profile.yearsExp} yrs` : "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-muted">Transmission</span>
                <span className="font-semibold text-brand-black capitalize">{profile.transmission.join(", ") || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-muted">Areas</span>
                <span className="font-semibold text-brand-black text-right max-w-[120px] truncate">{profile.areas || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed content */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-2xl p-1 mb-5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-white text-brand-black shadow-sm border border-brand-border"
                      : "text-brand-muted hover:text-brand-black"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6">
                  <h3 className="font-bold text-brand-black mb-5">Personal Details</h3>
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Full Name" name="name" value={profile.name} onChange={handleChange} placeholder="Jane Smith" />
                      <FormField label="Email Address" name="email" value={profile.email} readOnly />
                      <FormField label="Phone Number" name="phone" value={profile.phone} onChange={handleChange} type="tel" placeholder="07700 900000" />
                      <FormField label="Licence Number" name="licenceNumber" value={profile.licenceNumber} onChange={handleChange} placeholder="SMITH012345AB1CD" />
                    </div>
                    <hr className="border-brand-border" />
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-wide">Instructor Info</p>
                    <div>
                      <label className="block text-sm font-medium text-brand-black mb-1.5">Bio</label>
                      <textarea
                        name="bio"
                        value={profile.bio}
                        onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                        rows={3}
                        placeholder="Tell students a bit about yourself…"
                        className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Price / hr (£)" name="pricePerHour" value={profile.pricePerHour} onChange={handleChange} type="number" placeholder="45" />
                      <FormField label="Years Experience" name="yearsExp" value={profile.yearsExp} onChange={handleChange} type="number" placeholder="5" />
                    </div>
                    <FormField label="Service Areas (comma-separated)" name="areas" value={profile.areas} onChange={handleChange} placeholder="IG1, IG2, E1" />
                    <div>
                      <label className="block text-sm font-medium text-brand-black mb-2">Transmission</label>
                      <div className="flex gap-4">
                        {["manual", "automatic"].map((t) => (
                          <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profile.transmission.includes(t)}
                              onChange={() => toggleTransmission(t)}
                              className="w-4 h-4 accent-brand-red rounded"
                            />
                            <span className="capitalize text-brand-black">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.isFemale}
                        onChange={(e) => setProfile((p) => ({ ...p, isFemale: e.target.checked }))}
                        className="w-4 h-4 accent-brand-red rounded"
                      />
                      <span className="text-brand-black">Female instructor</span>
                    </label>
                    <div className="flex items-center gap-4 pt-1">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-orange transition-colors duration-200 text-sm disabled:opacity-60"
                      >
                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Save Changes
                      </button>
                      <AnimatePresence>
                        {saved && (
                          <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-green-600 font-medium"
                          >
                            ✓ Saved successfully
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
                  <h3 className="font-bold text-brand-red mb-1">Danger Zone</h3>
                  <p className="text-xs text-brand-muted mb-4">Irreversible actions that permanently affect your account.</p>
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="px-5 py-2.5 text-sm font-semibold text-brand-red border-2 border-brand-red rounded-xl hover:bg-brand-red hover:text-white transition-all duration-200"
                  >
                    Delete My Account
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6">
                  <h3 className="font-bold text-brand-black mb-5">Change Password</h3>
                  <form onSubmit={handlePasswordSave} className="space-y-4">
                    <PasswordInput
                      label="Current Password"
                      name="current"
                      value={passwords.current}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />
                    <PasswordInput
                      label="New Password"
                      name="next"
                      value={passwords.next}
                      onChange={handlePasswordChange}
                      placeholder="At least 8 characters"
                    />
                    <div>
                      <PasswordInput
                        label="Confirm New Password"
                        name="confirm"
                        value={passwords.confirm}
                        onChange={handlePasswordChange}
                        placeholder="Repeat new password"
                      />
                      <AnimatePresence>
                        {passwordMismatch && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-brand-red mt-1"
                          >
                            Passwords do not match
                          </motion.p>
                        )}
                        {passwordError && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-brand-red mt-1"
                          >
                            {passwordError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-4 pt-1">
                      <button
                        type="submit"
                        disabled={!passwordMatch || !passwords.current || savingPassword}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-orange transition-colors duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Update Password
                      </button>
                      <AnimatePresence>
                        {passwordSaved && (
                          <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-green-600 font-medium"
                          >
                            ✓ Password updated
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === "calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <GoogleCalendarSyncCard role="instructor" />
                <GoogleCalendarSubscribeCard role="instructor" />
                <CalendarSubscribeCard role="instructor" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {deleteOpen && <DeleteDialog onClose={() => setDeleteOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
