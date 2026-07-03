"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, LinkIcon, Unlink, CheckCircle2, AlertCircle, Apple, Info } from "lucide-react";
import { backendApiFetch } from "@/lib/backend-auth-fetch";

type Status = {
  connected: boolean;
  lastSync: string | null;
  label: string | null;
};

interface Props {
  role: "student" | "instructor";
}

export function AppleCalendarSyncCard({ role }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState<false | "connecting" | "disconnecting" | "resyncing">(false);
  const [flash, setFlash] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await backendApiFetch("/integrations/apple-calendar/status", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setStatus(json.data);
      }
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function connect() {
    if (!url.trim()) return;
    setBusy("connecting");
    setFlash(null);
    try {
      const res = await backendApiFetch("/integrations/apple-calendar/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), label: label.trim() || undefined }),
      });
      if (res.ok) {
        setFlash({ tone: "ok", msg: "Connected. First sync running now." });
        setUrl(""); setLabel("");
        setTimeout(load, 2000);
      } else {
        const json = await res.json().catch(() => ({ error: "Failed to connect" }));
        setFlash({ tone: "err", msg: json.error ?? "Failed to connect" });
      }
    } finally { setBusy(false); }
  }

  async function disconnect() {
    if (!confirm("Disconnect Apple Calendar? Existing blocks will be removed.")) return;
    setBusy("disconnecting");
    try {
      await backendApiFetch("/integrations/apple-calendar/disconnect", { method: "DELETE" });
      setFlash({ tone: "ok", msg: "Disconnected." });
      await load();
    } finally { setBusy(false); }
  }

  async function resync() {
    setBusy("resyncing");
    try {
      await backendApiFetch("/integrations/apple-calendar/resync", { method: "POST" });
      setFlash({ tone: "ok", msg: "Resync queued." });
      setTimeout(load, 3000);
    } finally { setBusy(false); }
  }

  const isInstructor = role === "instructor";

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Apple className="w-5 h-5 text-brand-black" />
        </div>
        <div>
          <h3 className="font-bold text-brand-black text-sm">Apple / iCloud Calendar sync</h3>
          <p className="text-xs text-brand-muted">
            {isInstructor
              ? "Paste your iCloud share URL. Busy events become unavailable slots. Syncs every 15 min."
              : "Paste your iCloud share URL. Read-only sync every 15 min."}
          </p>
        </div>
      </div>

      {flash && (
        <div
          className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
            flash.tone === "ok"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {flash.tone === "ok" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span>{flash.msg}</span>
        </div>
      )}

      {loading ? (
        <div className="h-9 bg-brand-surface rounded-xl animate-pulse" />
      ) : status?.connected ? (
        <div className="space-y-3">
          <div className="text-xs bg-brand-surface rounded-xl p-3 border border-brand-border">
            {status.label && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-brand-muted">Label</span>
                <span className="font-semibold text-brand-black truncate max-w-[60%]">{status.label}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-brand-muted">Last sync</span>
              <span className="font-medium">
                {status.lastSync ? new Date(status.lastSync).toLocaleString() : "—"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resync}
              disabled={!!busy}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-brand-border text-brand-black text-xs font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy === "resyncing" ? "animate-spin" : ""}`} />
              Resync now
            </button>
            <button
              onClick={disconnect}
              disabled={!!busy}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-red-200 text-red-700 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              <Unlink className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-brand-black mb-1">iCloud calendar URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="webcal://p12-caldav.icloud.com/... or https://..."
              className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-black mb-1">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Personal iCloud"
              className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
          </div>
          <button
            onClick={connect}
            disabled={!url.trim() || !!busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-black text-white text-xs font-semibold rounded-xl hover:bg-brand-red transition-colors disabled:opacity-60"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            {busy === "connecting" ? "Connecting…" : "Connect Apple Calendar"}
          </button>

          <button
            onClick={() => setShowHelp(v => !v)}
            className="w-full flex items-center justify-center gap-1 text-[10px] text-brand-muted hover:text-brand-black transition"
          >
            <Info className="w-3 h-3" />
            {showHelp ? "Hide" : "Where do I find this URL?"}
          </button>

          {showHelp && (
            <div className="text-[10px] text-brand-muted bg-brand-surface rounded-xl p-3 border border-brand-border space-y-1.5">
              <p className="font-semibold text-brand-black">On iPhone / iPad:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Open Calendar app.</li>
                <li>Tap Calendars → the (i) next to the calendar you want to share.</li>
                <li>Turn on <em>Public Calendar</em>.</li>
                <li>Tap <em>Share Link</em> → copy the webcal:// URL.</li>
                <li>Paste it above.</li>
              </ol>
              <p className="font-semibold text-brand-black pt-1">On Mac:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Open Calendar app.</li>
                <li>Right-click the calendar → <em>Sharing Settings</em>.</li>
                <li>Check <em>Public Calendar</em>.</li>
                <li>Click the share icon → Copy URL.</li>
                <li>Paste it above.</li>
              </ol>
              <p className="pt-1 italic">
                We only read start / end times. Event titles and attendees are not stored.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
