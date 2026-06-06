import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          if (typeof document === "undefined") return undefined;
          const match = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`));
          if (!match) return undefined;
          try {
            return decodeURIComponent(match.split("=").slice(1).join("="));
          } catch {
            return match.split("=").slice(1).join("=");
          }
        },
        set(name, value, options) {
          if (typeof document === "undefined") return;
          let cookie = `${name}=${encodeURIComponent(value)}`;
          if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
          if (options?.path) cookie += `; Path=${options.path}`;
          if (options?.domain) cookie += `; Domain=${options.domain}`;
          if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;
          if (options?.secure) cookie += `; Secure`;
          document.cookie = cookie;
        },
        remove(name, options) {
          if (typeof document === "undefined") return;
          let cookie = `${name}=; Max-Age=0`;
          if (options?.path) cookie += `; Path=${options.path}`;
          document.cookie = cookie;
        },
      },
    }
  );
}
