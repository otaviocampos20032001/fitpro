import { createBrowserClient } from "@supabase/ssr";

function sanitize(v: string): string {
  return v.replace(/[^\x00-\xFF]/g, (c) => encodeURIComponent(c));
}

function safeHeaders(headers: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  // Never use `new Headers(headers)` — that constructor throws on bad values.
  if (headers instanceof Headers) {
    headers.forEach((v, k) => { out[k] = sanitize(v); });
  } else if (Array.isArray(headers)) {
    for (const [k, v] of headers) out[String(k)] = sanitize(String(v));
  } else {
    for (const [k, v] of Object.entries(headers as Record<string, string>)) {
      out[k] = sanitize(String(v ?? ""));
    }
  }
  return out;
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) => {
          if (init?.headers) {
            init = { ...init, headers: safeHeaders(init.headers as HeadersInit) };
          }
          return fetch(url, init);
        },
      },
    }
  );
}
