"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCpf } from "@/lib/cpf";
import { formatDateTime } from "@/lib/format";
import type { Profile } from "@/components/auth/AuthProvider";

export interface UpgradeRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
}

interface AdminClientProps {
  initialProfiles: Profile[];
  initialRequests: UpgradeRequest[];
}

export function AdminClient({ initialProfiles, initialRequests }: AdminClientProps) {
  const [supabase] = useState(() => createClient());
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [requests, setRequests] = useState<UpgradeRequest[]>(initialRequests);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profileFor = (userId: string) => profiles.find((p) => p.id === userId);

  const setPlan = async (id: string, plan: "free" | "pro") => {
    setSavingId(id);
    setError(null);
    const { error } = await supabase.from("profiles").update({ plan }).eq("id", id);
    if (error) {
      setError("Não foi possível atualizar o plano.");
    } else {
      setProfiles((ps) => ps.map((p) => (p.id === id ? { ...p, plan } : p)));
    }
    setSavingId(null);
  };

  const resolveRequest = async (
    req: UpgradeRequest,
    decision: "approved" | "rejected",
  ) => {
    setSavingId(req.id);
    setError(null);
    try {
      if (decision === "approved") {
        const { error: planErr } = await supabase
          .from("profiles")
          .update({ plan: "pro" })
          .eq("id", req.user_id);
        if (planErr) throw planErr;
        setProfiles((ps) =>
          ps.map((p) => (p.id === req.user_id ? { ...p, plan: "pro" } : p)),
        );
      }
      const { error: reqErr } = await supabase
        .from("upgrade_requests")
        .update({ status: decision, resolved_at: new Date().toISOString() })
        .eq("id", req.id);
      if (reqErr) throw reqErr;
      setRequests((rs) => rs.filter((r) => r.id !== req.id));
    } catch {
      setError("Não foi possível processar a solicitação.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-dvh bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Painel administrativo</h1>
          <Link
            href="/"
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Voltar
          </Link>
        </div>

        {error && (
          <p className="rounded-lg bg-red-950/80 px-4 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        {/* Solicitações de upgrade pendentes */}
        {requests.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-emerald-400">
              Solicitações de Pro ({requests.length})
            </h2>
            {requests.map((req) => {
              const prof = profileFor(req.user_id);
              return (
                <div
                  key={req.id}
                  className="flex flex-col gap-3 rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {prof?.full_name || "(usuário)"}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {prof?.email} · pedido em{" "}
                      {formatDateTime(new Date(req.created_at).getTime())}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => resolveRequest(req, "approved")}
                      disabled={savingId === req.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
                    >
                      Aprovar Pro
                    </button>
                    <button
                      onClick={() => resolveRequest(req, "rejected")}
                      disabled={savingId === req.id}
                      className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Usuários */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-300">
            Usuários ({profiles.length})
          </h2>
          <p className="text-xs text-zinc-500">
            Free = 10 clipes/dia · Pro = ilimitado.
          </p>

          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl bg-zinc-900 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {p.full_name || "(sem nome)"}{" "}
                  {p.role === "admin" && (
                    <span className="ml-1 rounded bg-amber-600/80 px-1.5 py-0.5 text-[10px] font-bold">
                      ADMIN
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-400">
                  {p.email} · CPF {p.cpf ? formatCpf(p.cpf) : "—"}
                </p>
                <p className="text-[11px] text-zinc-500">
                  Desde {formatDateTime(new Date(p.created_at).getTime())}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-zinc-400">Plano:</span>
                <div className="flex overflow-hidden rounded-lg border border-zinc-700">
                  <button
                    onClick={() => setPlan(p.id, "free")}
                    disabled={savingId === p.id || p.plan === "free"}
                    className={`px-3 py-1.5 text-xs font-semibold transition ${
                      p.plan === "free"
                        ? "bg-zinc-200 text-black"
                        : "bg-zinc-800 text-white"
                    } disabled:opacity-100`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setPlan(p.id, "pro")}
                    disabled={savingId === p.id || p.plan === "pro"}
                    className={`px-3 py-1.5 text-xs font-semibold transition ${
                      p.plan === "pro"
                        ? "bg-emerald-500 text-black"
                        : "bg-zinc-800 text-white"
                    } disabled:opacity-100`}
                  >
                    Pro
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
