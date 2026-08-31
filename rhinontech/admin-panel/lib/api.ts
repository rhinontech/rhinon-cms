import Cookies from "js-cookie";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function authHeaders(): Record<string, string> {
  const token = Cookies.get("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

/**
 * Downloads an authenticated endpoint as a file.
 *
 * A plain <a href> can't carry the Authorization header, so the response is
 * fetched, turned into a blob and handed to a synthetic link. The object URL is
 * revoked afterwards so the blob isn't pinned in memory.
 */
export async function apiDownload(path: string, fallbackName: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Download failed" }));
    throw new Error(err.message || "Download failed");
  }

  // Prefer the server's filename when it sent one.
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || fallbackName;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Multipart upload — don't set Content-Type so the browser adds the multipart boundary.
export async function apiUpload<T = unknown>(path: string, file: File, field = "image"): Promise<T> {
  const token = Cookies.get("authToken");
  const form = new FormData();
  form.append(field, file);
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message || "Upload failed");
  }
  return res.json() as Promise<T>;
}

/**
 * POSTs to an endpoint that answers with NDJSON and invokes `onEvent` for each
 * line as it arrives.
 *
 * Used by the campaign send console: EventSource can't carry the Authorization
 * header, so the stream is read off a plain fetch body instead. Partial lines
 * are buffered — a chunk boundary can land mid-JSON.
 */
export async function apiStream<T = unknown>(
  path: string,
  onEvent: (event: T) => void,
  init?: RequestInit
): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    ...init,
    headers: { ...authHeaders(), ...(init?.headers as Record<string, string> | undefined) },
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        onEvent(JSON.parse(line) as T);
      } catch {
        /* ignore a malformed line rather than killing the stream */
      }
    }
  }
  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer) as T);
    } catch {
      /* trailing partial line */
    }
  }
}
