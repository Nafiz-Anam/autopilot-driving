import { backendApiUrl } from "@/lib/backend-api";
import {
  clearAppJwt,
  clearAppRefreshToken,
  getAppJwt,
  getAppRefreshToken,
  isAppJwtExpired,
  setAppJwt,
} from "@/lib/app-auth-token";

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  // Deduplicate concurrent refresh calls — all waiters share one request
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getAppRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch(backendApiUrl("/auth/app-refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearAppJwt();
        clearAppRefreshToken();
        return null;
      }
      const json = (await res.json()) as { data?: { token?: string } };
      const newToken = json?.data?.token;
      if (newToken) {
        setAppJwt(newToken);
        return newToken;
      }
      clearAppJwt();
      clearAppRefreshToken();
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function buildHeaders(init: RequestInit | undefined, token: string | null): Headers {
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

/**
 * Authenticated fetch for `/v1/*` routes with automatic token refresh.
 * Flow: send → 401 → refresh → retry once → if still 401, clear tokens.
 */
export async function backendApiFetch(path: string, init?: RequestInit): Promise<Response> {
  // Proactively refresh if token is already expired before sending
  let token = getAppJwt();
  if (!token || isAppJwtExpired(token)) {
    token = await tryRefreshToken();
  }

  const res = await fetch(backendApiUrl(path), {
    ...init,
    credentials: "omit",
    headers: buildHeaders(init, token),
  });

  if (res.status !== 401) return res;

  // 401 — try refresh and retry once
  const newToken = await tryRefreshToken();
  if (!newToken) return res; // refresh failed, return original 401

  return fetch(backendApiUrl(path), {
    ...init,
    credentials: "omit",
    headers: buildHeaders(init, newToken),
  });
}

/**
 * Returns auth headers, refreshing proactively if needed.
 * Use `backendApiFetch` instead when possible — it handles reactive 401 retry too.
 */
export async function getNextAuthBridgeHeaders(): Promise<Record<string, string>> {
  let token = getAppJwt();
  if (token && !isAppJwtExpired(token)) return { Authorization: `Bearer ${token}` };
  token = await tryRefreshToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

/**
 * Returns just the current app JWT, refreshing proactively if needed.
 * Use when you need the raw token (e.g. embedding into a URL for a browser redirect).
 */
export async function getNextAuthBridgeToken(): Promise<string | null> {
  let token = getAppJwt();
  if (token && !isAppJwtExpired(token)) return token;
  token = await tryRefreshToken();
  return token;
}
