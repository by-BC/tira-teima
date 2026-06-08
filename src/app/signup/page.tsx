"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCpf, isValidCpf, onlyDigits } from "@/lib/cpf";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (fullName.trim().length < 3) {
      setError("Informe seu nome completo.");
      return;
    }
    if (!isValidCpf(cpf)) {
      setError("CPF inválido. Verifique os dígitos.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (!consent) {
      setError("É preciso aceitar o uso dos seus dados (LGPD) para continuar.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim(), cpf: onlyDigits(cpf) },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered")) {
          setError("Este email já está cadastrado.");
        } else if (msg.includes("cpf") || msg.includes("duplicate") || msg.includes("unique")) {
          setError("Este CPF já está cadastrado.");
        } else {
          setError("Não foi possível criar a conta. Tente novamente.");
        }
        return;
      }

      if (data.session) {
        // login imediato (confirmação de email desativada)
        router.push("/");
        router.refresh();
      } else {
        setInfo("Conta criada! Confirme seu email para poder entrar.");
      }
    } catch {
      setError("Não foi possível criar a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 py-10 text-white">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            No plano gratuito você salva até 10 clipes por dia.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            autoComplete="name"
            required
            placeholder="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-red-500"
          />
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-red-500"
          />
          <input
            type="text"
            inputMode="numeric"
            required
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-red-500"
          />
          <input
            type="password"
            autoComplete="new-password"
            required
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-red-500"
          />

          <label className="flex items-start gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Autorizo o uso dos meus dados (nome, email e CPF) para criação e
              gestão da minha conta, conforme a LGPD.
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-950/80 px-4 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-emerald-950/80 px-4 py-2 text-sm text-emerald-200">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-red-600 px-6 py-3 text-lg font-bold text-white transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-red-400">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
