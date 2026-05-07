const STORAGE_KEY = "autopilot_app_jwt";

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
