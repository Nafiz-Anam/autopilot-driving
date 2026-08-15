import { backendApiFetch } from "@/lib/backend-auth-fetch";

export async function adminApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return backendApiFetch(`/admin${normalized}`, init);
}

/**
 * Throws with the backend's error message when `res` is not ok, so callers'
 * catch blocks (and any success toast after) only run on an actual success.
 */
export async function assertOk(res: Response): Promise<Response> {
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || payload?.message || `Request failed (${res.status})`);
  }
  return res;
}
