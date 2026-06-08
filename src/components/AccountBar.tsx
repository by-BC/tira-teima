"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth/AuthProvider";

export function AccountBar() {
  const router = useRouter();
  const { user, profile, loading, isPro, isAdmin, remaining, dailyLimit, signOut } =
    useAuth();

  if (loading || !user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      // força o Proxy a rodar e leva pro login (senão a sessão sai mas a tela fica)
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-y border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">
          {profile?.full_name || user.email}
        </p>
        <p className="text-xs text-zinc-400">
          {isPro
            ? "Plano Pro · clipes ilimitados"
            : `Plano Free · ${remaining}/${dailyLimit} clipes hoje`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!isPro && (
          <Link
            href="/pro"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
          >
            Seja Pro
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
          >
            Admin
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
