import axios from "axios";

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "a moment";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

export function extractApiError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data as
    | { message?: string; error?: string; retryAfterSeconds?: number; resetAt?: string }
    | undefined;

  if (err.response?.status === 429) {
    const secs =
      typeof data?.retryAfterSeconds === "number"
        ? data.retryAfterSeconds
        : data?.resetAt
        ? Math.max(0, Math.ceil((new Date(data.resetAt).getTime() - Date.now()) / 1000))
        : undefined;
    const base = data?.message ?? "Too many attempts.";
    return secs !== undefined ? `${base} Try again in ${formatDuration(secs)}.` : base;
  }

  return data?.message ?? data?.error ?? fallback;
}
