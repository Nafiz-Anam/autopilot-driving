"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Copy, CheckCheck, ExternalLink, Smartphone } from "lucide-react";
import { backendApiUrl } from "@/lib/backend-api";
import { getNextAuthBridgeHeaders } from "@/lib/backend-auth-fetch";

interface Props {
  role: "student" | "instructor";
}

export function CalendarSubscribeCard({ role }: Props) {
  const [webcalUrl, setWebcalUrl] = useState<string | null>(null);
  const [httpsUrl, setHttpsUrl] = useState<string | null>(null);
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
          setWebcalUrl(json.data?.webcalUrl ?? null);
          setHttpsUrl(json.data?.httpsUrl ?? null);
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

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-brand-red" />
        </div>
        <div>
          <h3 className="font-bold text-brand-black text-sm">Sync with Apple Calendar</h3>
          <p className="text-xs text-brand-muted">Auto-sync your lessons to iPhone, Mac or iCloud</p>
        </div>
      </div>

      {/* How it works */}
      <p className="text-xs text-brand-muted mb-5 leading-relaxed">
        Subscribe once and your calendar automatically updates whenever a new lesson is booked or cancelled — no manual imports needed.
      </p>

      {/* Steps */}
      <ol className="space-y-2.5 mb-5">
        {[
          { icon: Smartphone, text: 'Tap "Subscribe to Calendar" below' },
          { icon: CalendarDays, text: "Apple Calendar opens and asks to subscribe" },
          { icon: CheckCheck, text: "Tap Subscribe — your lessons sync automatically" },
        ].map(({ icon: Icon, text }, i) => (
          <li key={i} className="flex items-center gap-3 text-xs text-brand-muted">
            <span className="w-5 h-5 rounded-full bg-brand-surface border border-brand-border text-[10px] font-bold text-brand-black flex items-center justify-center flex-shrink-0">
              {i + 1}
            </span>
            <Icon className="w-3.5 h-3.5 text-brand-muted flex-shrink-0" />
            <span>{text}</span>
          </li>
        ))}
      </ol>

      {loading ? (
        <div className="h-9 bg-brand-surface rounded-xl animate-pulse" />
      ) : webcalUrl ? (
        <div className="flex gap-2">
          {/* Primary — opens Apple Calendar / calendar app */}
          <a
            href={webcalUrl}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-red text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Subscribe to Calendar
          </a>

          {/* Secondary — copy HTTPS URL for manual use / Google Calendar / Outlook */}
          <button
            onClick={copyUrl}
            title="Copy feed URL for Google Calendar or Outlook"
            className="px-3 py-2.5 border border-brand-border rounded-xl text-brand-muted hover:text-brand-black hover:border-gray-300 transition-colors"
          >
            {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <p className="text-xs text-brand-muted text-center py-2">Calendar link unavailable</p>
      )}

      {/* Other calendar note */}
      {httpsUrl && !loading && (
        <p className="text-[10px] text-brand-muted mt-2.5 text-center">
          Using Google Calendar or Outlook?{" "}
          <button onClick={copyUrl} className="text-brand-red hover:underline font-medium">
            Copy the feed URL
          </button>{" "}
          and add it as a subscription.
        </p>
      )}
    </div>
  );
}
