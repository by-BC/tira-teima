"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

const PRO_BENEFITS = [
  "Clipes ilimitados por dia",
  "Sem marca d'água (em breve)",
  "Prioridade em novos recursos",
];

export default function ProPage() {
  const { user, isPro, loading: authLoading, dailyLimit } = useAuth();
  const [supabase] = useState(() => createClient());
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("upgrade_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();
      if (active) {
        setPending(!!data);
        setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, supabase]);

  const requestUpgrade = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase
      .from("upgrade_requests")
      .insert({ user_id: user.id });
    if (error && error.code !== "23505") {
      setError("Não foi possível enviar a solicitação. Tente novamente.");
    } else {
      setPending(true); // sucesso ou já havia uma pendente
    }
    setSubmitting(false);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center bg-black px-6 py-10 text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-400">
            ← Voltar
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Tira-Teima <span className="text-emerald-400">Pro</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Salve quantos lances quiser, sem limite diário.
          </p>
        </div>

        {/* comparação Free x Pro */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm font-semibold text-zinc-300">Free</p>
            <p className="mt-2 text-2xl font-bold">{dailyLimit}</p>
            <p className="text-xs text-zinc-500">clipes por dia</p>
          </div>
          <div className="rounded-xl border border-emerald-600 bg-emerald-950/40 p-4">
            <p className="text-sm font-semibold text-emerald-300">Pro</p>
            <p className="mt-2 text-2xl font-bold">∞</p>
            <p className="text-xs text-emerald-400/80">clipes ilimitados</p>
          </div>
        </div>

        <ul className="space-y-2">
          {PRO_BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="text-emerald-400">✓</span> {b}
            </li>
          ))}
        </ul>

        {/* CTA conforme estado */}
        {authLoading || checking ? (
          <p className="text-center text-sm text-zinc-500">Carregando…</p>
        ) : isPro ? (
          <div className="rounded-xl bg-emerald-950/60 p-4 text-center">
            <p className="font-semibold text-emerald-300">Você já é Pro 🎉</p>
            <p className="text-sm text-emerald-400/80">Aproveite os clipes ilimitados.</p>
          </div>
        ) : pending ? (
          <div className="rounded-xl bg-zinc-900 p-4 text-center">
            <p className="font-semibold text-white">Solicitação enviada ✅</p>
            <p className="text-sm text-zinc-400">
              Um administrador vai revisar e liberar seu plano Pro.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={requestUpgrade}
              disabled={submitting}
              className="w-full rounded-full bg-emerald-600 px-6 py-3 text-lg font-bold text-white transition active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Enviando…" : "Solicitar upgrade"}
            </button>
            <p className="text-center text-xs text-zinc-500">
              Sem pagamento online por enquanto: a liberação é feita pela equipe.
            </p>
            {error && (
              <p className="rounded-lg bg-red-950/80 px-4 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
