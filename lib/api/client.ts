// API client. Custom domain on the CTA Worker; no auth in v1.
// Per Lock: "No /api prefix in URL constants -- endpoint paths add their own."
export const API_BASE_URL = "https://congresstradealerts.com";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type FetchOpts = {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText} for ${path}`);
  }
  return (await res.json()) as T;
}
