import { backendApiUrl } from "@/lib/backend-api";
import { getAppJwt, isAppJwtExpired } from "@/lib/app-auth-token";

/**
 * Authorization header for Express `/v1/*` driving-school routes (bridge-compatible JWT from `/auth/app-login`).
 */
export async function getNextAuthBridgeHeaders(): Promise<Record<string, string>> {
  const token = getAppJwt();
  if (token && !isAppJwtExpired(token)) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

/** Authenticated GET/POST/PATCH to Express `/v1` routes (same shape as `fetch`). */
export async function backendApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const authHeaders = await getNextAuthBridgeHeaders();
  const headers = new Headers(init?.headers);
  if (authHeaders.Authorization) headers.set("Authorization", authHeaders.Authorization);
  return fetch(backendApiUrl(path), { ...init, credentials: "omit", headers });
}
