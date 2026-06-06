import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Singleton — reutiliza a mesma instância no browser
let client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (client) return client;
  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: "of-personal-auth",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        detectSessionInUrl: true,
        flowType: "implicit",
      },
    }
  );
  return client;
}
