import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) => {
          if (init?.headers) {
            const sanitized: Record<string, string> = {};
            new Headers(init.headers as HeadersInit).forEach((value, key) => {
              // Remove any character above Latin-1 range (> U+00FF)
              sanitized[key] = value.replace(/[^\x00-\xFF]/g, (c) =>
                encodeURIComponent(c)
              );
            });
            init = { ...init, headers: sanitized };
          }
          return fetch(url, init);
        },
      },
    }
  );
}
