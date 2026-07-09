import { backendApiFetch } from "@/lib/backend-auth-fetch";

export async function instructorApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return backendApiFetch(`/instructor${normalized}`, init);
}
