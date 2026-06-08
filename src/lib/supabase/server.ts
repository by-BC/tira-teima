// Cliente Supabase para o servidor (Server Components, Route Handlers).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase não configurado. Defina as variáveis em .env.local (veja SUPABASE.md).",
    );
  }
  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // chamado de um Server Component: pode ser ignorado se o proxy
          // estiver renovando a sessão.
        }
      },
    },
  });
}
