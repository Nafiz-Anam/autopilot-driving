"use client";

import { useState, useEffect } from "react";
import { Copy, CheckCheck, ExternalLink } from "lucide-react";
import { backendApiUrl } from "@/lib/backend-api";
import { getNextAuthBridgeHeaders } from "@/lib/backend-auth-fetch";

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

export function GoogleCalendarSubscribeCard({ role }: Props) {
  const [httpsUrl, setHttpsUrl] = useState<string | null>(null);
  const [webcalUrl, setWebcalUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const headers = await getNextAuthBridgeHeaders();
        const endpoint = role === "instructor" ? "/instructor/calendar-url" : "/student/calendar-url";
        const res = await fetch(backendApiUrl(endpoint), { headers });
        if (res.ok) {
          const json = await res.json();
          setHttpsUrl(json.data?.httpsUrl ?? null);
          setWebcalUrl(json.data?.webcalUrl ?? null);
        }
      } catch { /* non-critical */ }
      finally { setLoading(false); }
    })();
  }, [role]);

  async function copyUrl() {
    if (!httpsUrl) return;
    await navigator.clipboard.writeText(httpsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const googleSubscribeUrl = webcalUrl
    ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`
    : null;

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <GoogleIcon />
        </div>
        <div>
          <h3 className="font-bold text-brand-black text-sm">Google Calendar</h3>
          <p className="text-xs text-brand-muted">Auto-sync lessons to Google Calendar</p>
        </div>
      </div>

      <p className="text-xs text-brand-muted mb-5 leading-relaxed">
        Subscribe once and every booking, cancellation, or reschedule instantly syncs to your Google Calendar — no sign-in required.
      </p>

      <ol className="space-y-2.5 mb-5">
        {[
          'Click "Add to Google Calendar" below',
          "Google Calendar opens — click Add",
          "Your lessons sync automatically",
        ].map((text, i) => (
          <li key={i} className="flex items-center gap-3 text-xs text-brand-muted">
            <span className="w-5 h-5 rounded-full bg-brand-surface border border-brand-border text-[10px] font-bold text-brand-black flex items-center justify-center flex-shrink-0">
              {i + 1}
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>

      {loading ? (
        <div className="h-9 bg-brand-surface rounded-xl animate-pulse" />
      ) : googleSubscribeUrl ? (
        <div className="flex gap-2">
          <a
            href={googleSubscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-brand-border text-brand-black text-xs font-semibold rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-sm"
          >
            <GoogleIcon />
            Add to Google Calendar
            <ExternalLink className="w-3 h-3 text-brand-muted" />
          </a>
          <button
            onClick={copyUrl}
            title="Copy feed URL"
            className="px-3 py-2.5 border border-brand-border rounded-xl text-brand-muted hover:text-brand-black hover:border-gray-300 transition-colors"
          >
            {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <p className="text-xs text-brand-muted text-center py-2">Calendar link unavailable</p>
      )}

      {httpsUrl && !loading && (
        <p className="text-[10px] text-brand-muted mt-2.5 text-center">
          Or{" "}
          <button onClick={copyUrl} className="text-brand-red hover:underline font-medium">
            copy the feed URL
          </button>{" "}
          and paste it manually in Google Calendar → Other calendars → From URL.
        </p>
      )}
    </div>
  );
}
