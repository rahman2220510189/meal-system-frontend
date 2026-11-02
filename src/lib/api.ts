// Small fetch wrapper: adds the login token, turns API errors into ApiError,
// and reports slow requests so the UI can explain Render's cold start.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

const TOKEN_KEY = "ms_token";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage blocked */
    }
  },
};

// ---- slow-request signal ---------------------------------------------------------
type Listener = (slow: boolean) => void;
const listeners = new Set<Listener>();
let slowCount = 0;
export function onSlowChange(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function setSlow(delta: number) {
  const before = slowCount > 0;
  slowCount = Math.max(0, slowCount + delta);
  const after = slowCount > 0;
  if (before !== after) listeners.forEach((l) => l(after));
}

// ---- unauthorized signal ---------------------------------------------------------
const authListeners = new Set<() => void>();
export function onUnauthorized(fn: () => void) {
  authListeners.add(fn);
  return () => {
    authListeners.delete(fn);
  };
}

type Opts = { method?: string; body?: unknown; form?: FormData; signal?: AbortSignal };

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let marked = false;
  const timer = setTimeout(() => {
    marked = true;
    setSlow(1);
  }, 2500);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: opts.method || "GET", headers, body, signal: opts.signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(0, "NETWORK", "Network error");
  } finally {
    clearTimeout(timer);
    if (marked) setSlow(-1);
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } })?.error;
    const code = err?.code || (res.status >= 500 ? "SERVER_ERROR" : "UNKNOWN");
    if (res.status === 401 && token) authListeners.forEach((l) => l());
    throw new ApiError(res.status, code, err?.message || res.statusText, err?.details);
  }
  return data as T;
}

export const fetcher = <T,>(path: string) => api<T>(path);
