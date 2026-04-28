"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Eye, EyeOff, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  postcode: string;
  licenceNumber: string;
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

interface NotifPrefs {
  emailBookings: boolean;
  emailReminders: boolean;
  smsReminders: boolean;
  smsPromotions: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  readOnly = false,
  placeholder = "",
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-black mb-1.5">
        {label}
        {readOnly && (
          <span className="ml-1.5 text-xs font-normal text-brand-muted">
            (read-only)
          </span>
        )}
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

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-brand-border last:border-0">
      <div>
        <p className="text-sm font-medium text-brand-black">{label}</p>
        <p className="text-xs text-brand-muted mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2",
          checked ? "bg-brand-red" : "bg-brand-border"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

function PasswordInput({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-brand-black mb-1.5">
        {label}
      </label>
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

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────
function DeleteDialog({ onClose }: { onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [input, setInput] = useState("");
  const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

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
            <h3 className="text-lg font-bold text-brand-black">
              Delete Account
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-brand-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-brand-muted mb-4">
          This will permanently delete your account, all bookings, and theory
          progress. <strong className="text-brand-black">This cannot be undone.</strong>
        </p>

        {!confirmed ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-black mb-1.5">
                Type{" "}
                <span className="font-mono font-bold text-brand-red">
                  {CONFIRM_PHRASE}
                </span>{" "}
                to continue
              </label>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={CONFIRM_PHRASE}
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
                disabled={input !== CONFIRM_PHRASE}
                onClick={() => setConfirmed(true)}
                className="flex-1 py-2.5 bg-brand-red text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete Account
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm font-semibold text-brand-black">
              Account deletion requested.
            </p>
            <p className="text-xs text-brand-muted mt-1">
              You will receive a confirmation email within 24 hours.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StudentProfilePage() {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [profile, setProfile] = useState<ProfileForm>({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    phone: "",
    dateOfBirth: "",
    postcode: "",
    licenceNumber: "",
  });

  const [passwords, setPasswords] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });

  const [notifs, setNotifs] = useState<NotifPrefs>({
    emailBookings: true,
    emailReminders: true,
    smsReminders: true,
    smsPromotions: false,
  });

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const role =
    (session?.user as { role?: string })?.role ?? "STUDENT";

  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPasswords((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaved(true);
    setPasswords({ current: "", next: "", confirm: "" });
    setTimeout(() => setPasswordSaved(false), 3000);
  }

  const passwordMatch =
    passwords.next && passwords.confirm && passwords.next === passwords.confirm;
  const passwordMismatch =
    passwords.next && passwords.confirm && passwords.next !== passwords.confirm;

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div
      className=""
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-black">My Profile</h1>
        <p className="text-brand-muted mt-1 text-sm">
          Manage your personal details and preferences.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: avatar card ── */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 flex flex-col items-center text-center">
            {/* Avatar upload area */}
            <div className="relative mb-4 group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-brand-red to-brand-orange flex items-center justify-center text-white text-3xl font-extrabold shadow-lg">
                {initials}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-brand-muted mb-4">
              Click to upload a photo
            </p>

            <p className="font-bold text-brand-black text-lg leading-tight">
              {profile.name || "Your Name"}
            </p>
            <p className="text-xs text-brand-muted mt-0.5">{profile.email}</p>
            <span className="mt-2 text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-red-50 text-brand-red">
              {role}
            </span>

            <div className="mt-6 w-full border-t border-brand-border pt-4 space-y-2 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-brand-muted">Lessons completed</span>
                <span className="font-semibold text-brand-black">4</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-muted">Hours driven</span>
                <span className="font-semibold text-brand-black">4 hrs</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-muted">Theory progress</span>
                <span className="font-semibold text-brand-red">62%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Right column: forms ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal details */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl border border-brand-border shadow-sm p-6"
          >
            <h3 className="font-bold text-brand-black mb-5">
              Personal Details
            </h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Full Name"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Jane Smith"
                />
                <FormField
                  label="Email Address"
                  name="email"
                  value={profile.email}
                  readOnly
                />
                <FormField
                  label="Phone Number"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  type="tel"
                  placeholder="07700 900000"
                />
                <FormField
                  label="Date of Birth"
                  name="dateOfBirth"
                  value={profile.dateOfBirth}
                  onChange={handleProfileChange}
                  type="date"
                />
                <FormField
                  label="Postcode"
                  name="postcode"
                  value={profile.postcode}
                  onChange={handleProfileChange}
                  placeholder="SL1 1AA"
                />
                <FormField
                  label="Provisional Licence No."
                  name="licenceNumber"
                  value={profile.licenceNumber}
                  onChange={handleProfileChange}
                  placeholder="SMITJ9701234AB9IJ"
                  hint="16-character UK driving licence number"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-orange transition-colors duration-200 text-sm"
                >
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
          </motion.div>

          {/* Password change */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl border border-brand-border shadow-sm p-6"
          >
            <h3 className="font-bold text-brand-black mb-5">
              Change Password
            </h3>
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
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <button
                  type="submit"
                  disabled={!passwordMatch || !passwords.current}
                  className="px-6 py-2.5 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-orange transition-colors duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
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
          </motion.div>

          {/* Notification preferences */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl border border-brand-border shadow-sm p-6"
          >
            <h3 className="font-bold text-brand-black mb-1">
              Notification Preferences
            </h3>
            <p className="text-xs text-brand-muted mb-4">
              Control how we contact you about your lessons.
            </p>
            <ToggleSwitch
              checked={notifs.emailBookings}
              onChange={(v) => setNotifs((n) => ({ ...n, emailBookings: v }))}
              label="Email — Booking confirmations"
              description="Receive email receipts when you book or cancel a lesson"
            />
            <ToggleSwitch
              checked={notifs.emailReminders}
              onChange={(v) =>
                setNotifs((n) => ({ ...n, emailReminders: v }))
              }
              label="Email — Lesson reminders"
              description="24-hour reminder before each upcoming lesson"
            />
            <ToggleSwitch
              checked={notifs.smsReminders}
              onChange={(v) => setNotifs((n) => ({ ...n, smsReminders: v }))}
              label="SMS — Lesson reminders"
              description="Text message 2 hours before your lesson"
            />
            <ToggleSwitch
              checked={notifs.smsPromotions}
              onChange={(v) =>
                setNotifs((n) => ({ ...n, smsPromotions: v }))
              }
              label="SMS — Promotions &amp; offers"
              description="Occasional offers and news from AutoPilot"
            />
          </motion.div>

          {/* Danger zone */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl border border-red-200 shadow-sm p-6"
          >
            <h3 className="font-bold text-brand-red mb-1">Danger Zone</h3>
            <p className="text-xs text-brand-muted mb-4">
              Irreversible actions that permanently affect your account.
            </p>
            <button
              onClick={() => setDeleteOpen(true)}
              className="px-5 py-2.5 text-sm font-semibold text-brand-red border-2 border-brand-red rounded-xl hover:bg-brand-red hover:text-white transition-all duration-200"
            >
              Delete My Account
            </button>
          </motion.div>
        </div>
      </div>

      {/* Delete dialog */}
      <AnimatePresence>
        {deleteOpen && (
          <DeleteDialog onClose={() => setDeleteOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
