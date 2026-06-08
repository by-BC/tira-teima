// Lê as variáveis de ambiente do Supabase. Aceita o novo formato de chave
// (sb_publishable_...) e, como fallback, a antiga anon key.

export interface SupabaseEnv {
  url: string;
  key: string;
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}
