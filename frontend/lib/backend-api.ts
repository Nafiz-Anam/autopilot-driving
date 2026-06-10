const DEFAULT_LOCAL_API = "http://localhost:8008/v1";

export function getBackendApiBase(): string {
  const envBase = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");

  // Derive API URL from current hostname so any production domain works
  // without needing a hardcoded fallback list.
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return `https://api.${window.location.hostname}/v1`;
  }

  return DEFAULT_LOCAL_API;
}

export function backendApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendApiBase()}${normalized}`;
}
