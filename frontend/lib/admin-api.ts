import { backendApiUrl } from "@/lib/backend-api";
import { getNextAuthBridgeHeaders } from "@/lib/backend-auth-fetch";

export async function adminApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const authHeaders = await getNextAuthBridgeHeaders();
  const headers = new Headers(init?.headers);
  if (authHeaders.Authorization) {
    headers.set("Authorization", authHeaders.Authorization);
  }

  return fetch(backendApiUrl(`/admin${normalized}`), {
    ...init,
    credentials: "omit",
    headers,
  });
}
