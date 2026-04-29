"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Webhook,
  Key,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StripeSettings {
  stripe_publishable_key: string;
  stripe_secret_key_masked: string;
  stripe_webhook_secret_masked: string;
  has_secret_key: boolean;
  has_webhook_secret: boolean;
  has_publishable_key: boolean;
  mode: "live" | "test";
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function MaskedInput({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  description,
  currentMasked,
  hasValue,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  currentMasked?: string;
  hasValue?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-brand-black">
        <Icon className="w-4 h-4 text-brand-muted" />
        {label}
      </label>
      {description && (
        <p className="text-xs text-brand-muted">{description}</p>
      )}
      {hasValue && currentMasked && !value && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
          <span className="text-xs font-mono text-green-700">{currentMasked}</span>
          <span className="text-xs text-green-600 ml-auto">(configured)</span>
        </div>
      )}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hasValue ? "Leave blank to keep current value" : placeholder}
          className="w-full px-4 py-3 pr-12 border border-brand-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-red bg-white"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-muted hover:text-brand-black transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function PlainInput({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  description,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-brand-black">
        <Icon className="w-4 h-4 text-brand-muted" />
        {label}
      </label>
      {description && <p className="text-xs text-brand-muted">{description}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-brand-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-red bg-white"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [settings, setSettings] = useState<StripeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSettings(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const body: Record<string, string> = {};
      if (publishableKey.trim()) body.stripe_publishable_key = publishableKey.trim();
      if (secretKey.trim()) body.stripe_secret_key = secretKey.trim();
      if (webhookSecret.trim()) body.stripe_webhook_secret = webhookSecret.trim();

      if (Object.keys(body).length === 0) {
        setSaveMsg({ type: "error", text: "No changes to save." });
        return;
      }

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setSaveMsg({ type: "success", text: "Stripe credentials saved successfully." });
        setPublishableKey("");
        setSecretKey("");
        setWebhookSecret("");
        // Refresh displayed settings
        const refreshed = await fetch("/api/admin/settings").then((r) => r.json());
        if (refreshed.success) setSettings(refreshed.data);
      } else {
        setSaveMsg({ type: "error", text: data.error ?? "Failed to save settings." });
      }
    } catch {
      setSaveMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection" }),
      });
      const data = await res.json();

      if (data.success) {
        setTestResult({
          type: "success",
          text: `Connected! Currency: ${data.data.currency}`,
        });
      } else {
        setTestResult({ type: "error", text: data.error ?? "Connection failed." });
      }
    } catch {
      setTestResult({ type: "error", text: "Network error. Please try again." });
    } finally {
      setTesting(false);
    }
  }

  const isConfigured = settings?.has_secret_key && settings?.has_publishable_key;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Page Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-black">Payment Settings</h1>
        <p className="text-brand-muted mt-1 text-sm">
          Configure Stripe payment gateway credentials. Changes take effect immediately.
        </p>
      </motion.div>

      {/* Status Banner */}
      {!loading && (
        <motion.div
          variants={itemVariants}
          className={cn(
            "rounded-2xl border px-5 py-4 mb-6 flex items-center gap-3",
            isConfigured
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          )}
        >
          {isConfigured ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700">
                  Stripe is configured and active
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Mode:{" "}
                  <span
                    className={cn(
                      "font-bold uppercase",
                      settings?.mode === "live" ? "text-green-700" : "text-yellow-700"
                    )}
                  >
                    {settings?.mode ?? "test"}
                  </span>
                </p>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-green-200 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-50 transition-colors disabled:opacity-60"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Test Connection
              </button>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-700">
                  Stripe is not fully configured
                </p>
                <p className="text-xs text-yellow-600 mt-0.5">
                  Payments will fail until all credentials are set.
                </p>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Test Result */}
      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-5 border",
            testResult.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-600"
          )}
        >
          {testResult.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          {testResult.text}
        </motion.div>
      )}

      {/* Credentials Form */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden mb-6"
      >
        <div className="px-6 py-4 border-b border-brand-border flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-brand-red" />
          <h3 className="font-bold text-brand-black text-sm">Stripe API Credentials</h3>
        </div>

        {loading ? (
          <div className="p-6 space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-40" />
                <div className="h-11 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <PlainInput
              label="Publishable Key"
              value={publishableKey}
              onChange={setPublishableKey}
              placeholder={settings?.has_publishable_key ? settings.stripe_publishable_key : "pk_test_…"}
              icon={Key}
              description="Safe to use in client-side code. Starts with pk_test_ or pk_live_."
            />

            <MaskedInput
              label="Secret Key"
              value={secretKey}
              onChange={setSecretKey}
              placeholder="sk_test_…"
              icon={Shield}
              description="Keep this private — never expose in frontend code. Starts with sk_test_ or sk_live_."
              currentMasked={settings?.stripe_secret_key_masked}
              hasValue={settings?.has_secret_key}
            />

            <MaskedInput
              label="Webhook Secret"
              value={webhookSecret}
              onChange={setWebhookSecret}
              placeholder="whsec_…"
              icon={Webhook}
              description="Used to verify webhook events from Stripe. Find it in your Stripe dashboard → Webhooks."
              currentMasked={settings?.stripe_webhook_secret_masked}
              hasValue={settings?.has_webhook_secret}
            />
          </div>
        )}

        <div className="px-6 py-4 border-t border-brand-border bg-brand-surface/50 flex items-center justify-between gap-4">
          {saveMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex items-center gap-2 text-sm",
                saveMsg.type === "success" ? "text-green-700" : "text-red-600"
              )}
            >
              {saveMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              {saveMsg.text}
            </motion.div>
          )}
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={saving || loading || (!publishableKey.trim() && !secretKey.trim() && !webhookSecret.trim())}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-red text-white rounded-xl text-sm font-semibold hover:bg-brand-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Credentials
          </button>
        </div>
      </motion.div>

      {/* Webhook Setup Guide */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden mb-6"
      >
        <div className="px-6 py-4 border-b border-brand-border flex items-center gap-2">
          <Webhook className="w-4 h-4 text-brand-red" />
          <h3 className="font-bold text-brand-black text-sm">Webhook Configuration</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-brand-muted">
            Set up a webhook in your Stripe Dashboard to automatically confirm bookings after payment.
          </p>
          <div className="bg-brand-surface rounded-xl p-4 border border-brand-border">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-2">Webhook Endpoint URL</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-brand-black flex-1 break-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/payments/webhook`
                  : "/api/payments/webhook"}
              </code>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-2">Events to listen for</p>
            <ul className="space-y-1.5">
              {["payment_intent.succeeded", "payment_intent.payment_failed"].map((evt) => (
                <li key={evt} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <code className="text-xs font-mono text-brand-black bg-brand-surface px-2 py-0.5 rounded">{evt}</code>
                </li>
              ))}
            </ul>
          </div>
          <a
            href="https://dashboard.stripe.com/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red hover:text-brand-orange transition-colors"
          >
            Open Stripe Webhooks Dashboard
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>

      {/* Key Setup Guide */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-brand-border flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-red" />
          <h3 className="font-bold text-brand-black text-sm">How to get your Stripe keys</h3>
        </div>
        <div className="p-6">
          <ol className="space-y-3 text-sm text-brand-muted list-none">
            {[
              { step: "1", text: "Log in to your Stripe Dashboard at dashboard.stripe.com" },
              { step: "2", text: 'Go to Developers → API Keys' },
              { step: "3", text: "Copy the Publishable key (pk_…) and Secret key (sk_…)" },
              { step: "4", text: "For the Webhook Secret: go to Developers → Webhooks, add endpoint, then reveal the signing secret (whsec_…)" },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-red/10 text-brand-red text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <a
            href="https://dashboard.stripe.com/apikeys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red hover:text-brand-orange transition-colors mt-4"
          >
            Open Stripe API Keys
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
