"use client";

interface StatusPillProps {
  recording: boolean;
  bufferSeconds: number;
}

export function StatusPill({ recording, bufferSeconds }: StatusPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          recording ? "animate-pulse bg-red-500" : "bg-zinc-500"
        }`}
      />
      {recording ? `Gravando · buffer ${bufferSeconds}s` : "Iniciando…"}
    </div>
  );
}
