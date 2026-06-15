"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Unlink, CalendarCheck } from "lucide-react";
import { backendApiUrl } from "@/lib/backend-api";
import { getNextAuthBridgeHeaders } from "@/lib/backend-auth-fetch";
import { getAppJwt } from "@/lib/app-auth-token";

interface Status {
  connected: boolean;
  configured: boolean;
}

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

export function GoogleCalendarConnect() {
  const [status, setStatus] = useState<Status | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState<"connected" | "error" | null>(null);

  useEffect(() => {
    // Check for redirect param from OAuth callback
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cal = params.get("cal");
      if (cal === "connected" || cal === "error") {
        setToast(cal);
        // Clean up URL without reload
        window.history.replaceState({}, "", window.location.pathname);
        setTimeout(() => setToast(null), 4000);
      }
    }
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const headers = await getNextAuthBridgeHeaders();
      const res = await fetch(backendApiUrl("/integrations/google-calendar/status"), { headers });
      if (res.ok) {
        const json = await res.json();
        setStatus(json.data);
      }
    } catch { /* non-critical */ }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const headers = await getNextAuthBridgeHeaders();
      await fetch(backendApiUrl("/integrations/google-calendar/disconnect"), {
        method: "DELETE",
        headers,
      });
      setStatus((s) => s ? { ...s, connected: false } : s);
    } catch { /* ignore */ }
    finally { setDisconnecting(false); }
  }

  function handleConnect() {
    const token = getAppJwt() ?? "";
    window.location.href = `${backendApiUrl("/integrations/google-calendar/connect")}?appToken=${encodeURIComponent(token)}`;
  }

  const loading = status === null;
  const configured = status?.configured ?? false;

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-brand-black text-sm">Google Calendar</h3>
          <p className="text-xs text-brand-muted">Lessons appear automatically — no action needed</p>
        </div>
      </div>

      <p className="text-xs text-brand-muted mb-5 leading-relaxed">
        Connect once and every booking, cancellation, or reschedule instantly syncs to your Google Calendar.
        Works on Android, iPhone (Google Calendar app), Mac, and web.
      </p>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-4 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              toast === "connected"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-brand-red"
            }`}
          >
            {toast === "connected" ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Google Calendar connected successfully!</>
            ) : (
              <>Connection failed — please try again or check your Google account settings.</>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-brand-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking status…
        </div>
      ) : !configured ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          Google Calendar integration is not yet configured. Contact support to enable it.
        </div>
      ) : status?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-green-700">Connected — lessons sync automatically</span>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-brand-border text-brand-muted text-xs font-medium rounded-xl hover:border-red-200 hover:text-brand-red transition-colors disabled:opacity-50"
          >
            {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
            Disconnect Google Calendar
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white border border-brand-border text-brand-black text-xs font-semibold rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-sm"
        >
          <GoogleIcon />
          Sign in with Google to connect
        </button>
      )}
    </div>
  );
}
