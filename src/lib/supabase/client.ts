// Cliente Supabase para o navegador (componentes client).

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let cached: BrowserClient | null = null;

export function createClient(): BrowserClient {
  if (cached) return cached;
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local (veja SUPABASE.md).",
    );
  }
  cached = createBrowserClient(env.url, env.key);
  return cached;
}
