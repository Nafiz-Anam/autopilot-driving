"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, LinkIcon, Unlink, CheckCircle2, AlertCircle } from "lucide-react";
import { backendApiUrl } from "@/lib/backend-api";
import { getNextAuthBridgeHeaders, getNextAuthBridgeToken } from "@/lib/backend-auth-fetch";

type Status = {
  connected: boolean;
  configured: boolean;
  externalEmail: string | null;
  syncCalendarId: string | null;
  watchExpiration: string | null;
  lastSync: string | null;
  initialSyncDone: boolean;
};

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

interface Props {
  role: "student" | "instructor";
}

export function GoogleCalendarSyncCard({ role }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectHref, setConnectHref] = useState<string | null>(null);
  const [busy, setBusy] = useState<false | "connecting" | "disconnecting" | "resyncing">(false);
  const [flash, setFlash] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const headers = await getNextAuthBridgeHeaders();
      const [statusRes, token] = await Promise.all([
        fetch(backendApiUrl("/integrations/google-calendar/status"), { headers, cache: "no-store" }),
        getNextAuthBridgeToken(),
      ]);
      if (statusRes.ok) {
        const json = await statusRes.json();
        setStatus(json.data);
      } else {
        setLoadError(true);
      }
      if (token) {
        setConnectHref(
          backendApiUrl(`/integrations/google-calendar/connect?appToken=${encodeURIComponent(token)}`)
        );
      }
    } catch { setLoadError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cal = params.get("cal");
    if (cal === "connected") {
      setFlash({ tone: "ok", msg: "Google Calendar connected — lessons will now sync automatically." });
    } else if (cal === "error") {
      setFlash({ tone: "err", msg: "Connection failed. Please try again." });
    }
    if (cal) {
      const url = new URL(window.location.href);
      url.searchParams.delete("cal");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  async function disconnect() {
    if (!confirm("Disconnect Google Calendar? Future lessons will stop syncing to your calendar.")) return;
    setBusy("disconnecting");
    try {
      const headers = await getNextAuthBridgeHeaders();
      await fetch(backendApiUrl("/integrations/google-calendar/disconnect"), {
        method: "DELETE",
        headers,
      });
      setFlash({ tone: "ok", msg: "Disconnected." });
      await load();
    } finally { setBusy(false); }
  }

  async function resync() {
    setBusy("resyncing");
    try {
      const headers = await getNextAuthBridgeHeaders();
      await fetch(backendApiUrl("/integrations/google-calendar/resync"), {
        method: "POST",
        headers,
      });
      setFlash({ tone: "ok", msg: "Resync queued." });
      setTimeout(load, 3000);
    } finally { setBusy(false); }
  }

  const isInstructor = role === "instructor";

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <GoogleIcon />
        </div>
        <div>
          <h3 className="font-bold text-brand-black text-sm">Google Calendar sync</h3>
          <p className="text-xs text-brand-muted">
            {isInstructor
              ? "Two-way sync: your busy blocks become unavailable slots; lessons appear on your calendar."
              : "Two-way sync: your lessons appear on your calendar automatically."}
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
      ) : loadError ? (
        <p className="text-xs text-red-600 py-2">
          Failed to load status.{" "}
          <button onClick={load} className="underline font-semibold">Retry</button>
        </p>
      ) : !status?.configured ? (
        <p className="text-xs text-brand-muted py-2">Google Calendar integration is not configured on the server.</p>
      ) : status.connected ? (
        <div className="space-y-3">
          <div className="text-xs bg-brand-surface rounded-xl p-3 border border-brand-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-brand-muted">Connected as</span>
              <span className="font-semibold text-brand-black truncate max-w-[60%]">{status.externalEmail ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-brand-muted">Initial sync</span>
              <span className="font-medium">{status.initialSyncDone ? "Done" : "Pending"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-muted">Watch expires</span>
              <span className="font-medium">
                {status.watchExpiration ? new Date(status.watchExpiration).toLocaleString() : "—"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resync}
              disabled={!!busy}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-brand-border text-brand-black text-xs font-semibold rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-60"
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
      ) : connectHref ? (
        <a
          href={connectHref}
          onClick={() => setBusy("connecting")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-red text-white text-xs font-semibold rounded-xl hover:bg-brand-orange transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          Connect Google Calendar
        </a>
      ) : (
        <p className="text-xs text-brand-muted text-center py-2">Sign-in required</p>
      )}
    </div>
  );
}
