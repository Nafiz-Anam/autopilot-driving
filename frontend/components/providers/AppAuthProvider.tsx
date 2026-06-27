"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { backendApiUrl } from "@/lib/backend-api";
import {
  clearAppJwt,
  clearAppRefreshToken,
  getAppJwt,
  isAppJwtExpired,
  setAppJwt,
  setAppRefreshToken,
} from "@/lib/app-auth-token";

export type AppUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
};

export type AppSession = {
  user: AppUser;
};

type Status = "loading" | "authenticated" | "unauthenticated";

type AppAuthContextValue = {
  data: AppSession | null;
  status: Status;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refreshSession: () => Promise<void>;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function useAppAuth(): AppAuthContextValue {
  const ctx = useContext(AppAuthContext);
  if (!ctx) {
    throw new Error("useAppAuth must be used within AppAuthProvider");
  }
  return ctx;
}

/** Replaces `useSession` from next-auth for the driving-school app. */
export function useAppSession() {
  const { data, status, refreshSession } = useAppAuth();
  return { data, status, update: refreshSession };
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppSession | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const loadSession = useCallback(async () => {
    let token = getAppJwt();
    if (!token || isAppJwtExpired(token)) {
      clearAppJwt();
      setData(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const res = await fetch(backendApiUrl("/auth/app-session"), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "omit",
      });
      if (!res.ok) {
        clearAppJwt();
        setData(null);
        setStatus("unauthenticated");
        return;
      }
      const json = (await res.json()) as {
        success?: boolean;
        data?: { user?: AppUser };
      };
      const user = json?.data?.user;
      if (!user?.id) {
        clearAppJwt();
        setData(null);
        setStatus("unauthenticated");
        return;
      }
      setData({
        user: {
          id: user.id,
          name: user.name ?? null,
          email: user.email,
          role: user.role,
          image: null,
        },
      });
      setStatus("authenticated");
    } catch {
      clearAppJwt();
      setData(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(backendApiUrl("/auth/app-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "omit",
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: { token?: string; refreshToken?: string };
        message?: string;
        error?: { message?: string };
      };
      const token = json?.data?.token;
      const refreshToken = json?.data?.refreshToken;
      if (!res.ok || !token) {
        const msg =
          json?.error?.message ??
          json?.message ??
          (typeof json === "object" && json !== null && "message" in json
            ? String((json as { message?: string }).message)
            : null);
        return {
          ok: false as const,
          error: msg || "Invalid email or password. Please try again.",
        };
      }
      setAppJwt(token);
      if (refreshToken) setAppRefreshToken(refreshToken);
      await loadSession();
      return { ok: true as const };
    },
    [loadSession]
  );

  const logout = useCallback(() => {
    clearAppJwt();
    clearAppRefreshToken();
    setData(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({
      data,
      status,
      login,
      logout,
      refreshSession: loadSession,
    }),
    [data, status, login, logout, loadSession]
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}
