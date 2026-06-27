import { backendApiFetch } from "@/lib/backend-auth-fetch";

export async function adminApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return backendApiFetch(`/admin${normalized}`, init);
}
