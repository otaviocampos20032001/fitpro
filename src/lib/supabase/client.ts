import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Singleton — reutiliza a mesma instância no browser
let client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During SSR at build time env vars may be absent — return a no-op stub
  // so the module doesn't crash. Real calls only happen on the client.
  if (!url || !key) {
    // Return a minimal stub that will never be used in production
    // (all createClient() calls inside components happen in useEffect or event handlers)
    return createSupabaseClient(
      "https://placeholder.supabase.co",
      "placeholder-key",
      { auth: { persistSession: false } }
    );
  }

  client = createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      storageKey: "of-personal-auth",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      detectSessionInUrl: true,
      flowType: "implicit",
    },
  });
  return client;
}
