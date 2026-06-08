"use client";

import type { CameraStatus } from "@/types";

interface PermissionGateProps {
  status: CameraStatus;
  error: string | null;
  onStart: () => void;
}

/**
 * Tela inicial: explica o que vai acontecer (e que é tudo local/privado) antes
 * de pedir a permissão de câmera. O toque no botão é o gesto do usuário que
 * habilita câmera, áudio de feedback e a Media Session.
 */
export function PermissionGate({ status, error, onStart }: PermissionGateProps) {
  const requesting = status === "requesting";

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Tira-<span className="text-red-500">Teima</span>
        </h1>
        <p className="text-sm text-zinc-400">
          Replay instantâneo dos seus melhores lances. Sem precisar de ninguém
          filmando.
        </p>
      </div>

      <ol className="max-w-xs space-y-2 text-left text-sm text-zinc-300">
        <li>1. Apoie o celular apontando para a quadra.</li>
        <li>2. A câmera grava em loop, guardando os últimos 18s.</li>
        <li>
          3. Fez um lance bom? Toque em <strong>REPLAY</strong> e salve os 15s
          anteriores.
        </li>
      </ol>

      <button
        onClick={onStart}
        disabled={requesting}
        className="w-full max-w-xs rounded-full bg-red-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
      >
        {requesting ? "Abrindo câmera…" : "Ligar câmera"}
      </button>

      {error && (
        <p className="max-w-xs rounded-lg bg-red-950/80 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <p className="max-w-xs text-xs text-zinc-500">
        Tudo fica salvo apenas neste dispositivo. Nada é enviado para a internet.
        Requer conexão segura (HTTPS) para acessar a câmera.
      </p>
    </div>
  );
}
