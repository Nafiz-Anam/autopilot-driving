const DEFAULT_LOCAL_API = "http://localhost:8008/v1";
const PROD_API = "https://driving.agiloit.com/v1";

export function getBackendApiBase(): string {
  const envBase = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    if (window.location.hostname === "driving.agiloit.com") {
      return PROD_API;
    }
  }

  return DEFAULT_LOCAL_API;
}

export function backendApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendApiBase()}${normalized}`;
}
