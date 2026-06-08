"use client";

interface ReplayButtonProps {
  onTrigger: () => void;
  disabled?: boolean;
  saving?: boolean;
  ready?: boolean;
  countdown?: number; // segundos restantes até o buffer encher
  clipSeconds: number;
}

export function ReplayButton({
  onTrigger,
  disabled,
  saving,
  ready = true,
  countdown = 0,
  clipSeconds,
}: ReplayButtonProps) {
  const blocked = disabled || saving || !ready;

  return (
    <button
      onClick={onTrigger}
      disabled={blocked}
      aria-label={
        ready
          ? `Salvar replay dos últimos ${clipSeconds} segundos`
          : `Aguardando o buffer encher, ${countdown} segundos restantes`
      }
      className="grid h-24 w-24 place-items-center rounded-full bg-red-600 text-center font-bold text-white shadow-2xl ring-4 ring-white/40 transition active:scale-95 disabled:opacity-40"
    >
      {saving ? (
        <span className="text-xs">Salvando…</span>
      ) : !ready ? (
        <span className="leading-tight">
          <span className="block text-2xl tabular-nums">{countdown}</span>
          <span className="block text-[10px] font-normal opacity-80">
            aguarde
          </span>
        </span>
      ) : (
        <span className="leading-tight">
          REPLAY
          <span className="block text-[10px] font-normal opacity-80">
            {clipSeconds}s
          </span>
        </span>
      )}
    </button>
  );
}
