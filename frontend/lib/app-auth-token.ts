const STORAGE_KEY = "autopilot_app_jwt";
const REFRESH_KEY = "autopilot_app_refresh_jwt";

export function getAppJwt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAppJwt(token: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearAppJwt(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    clearAppRefreshToken();
  } catch {
    /* ignore */
  }
}

/** Returns true if JWT is missing or past exp (best-effort, 60s skew). */
export function isAppJwtExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    if (!payload.exp) return false;
    return Date.now() / 1000 > payload.exp - 60;
  } catch {
    return true;
  }
}

export function getAppRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setAppRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REFRESH_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearAppRefreshToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}
