"use client";

import { useClips } from "@/hooks/useClips";
import { ClipCard } from "./ClipCard";

export function ClipGallery() {
  const { clips, loading, remove, clearAll } = useClips();

  return (
    <section className="min-h-[40vh] bg-zinc-950 px-3 pb-12 pt-4">
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-white">
          Meus replays{" "}
          {clips.length > 0 && (
            <span className="text-zinc-500">({clips.length})</span>
          )}
        </h2>
        {clips.length > 0 && (
          <button
            onClick={() => clearAll()}
            className="text-xs text-zinc-400 underline-offset-2 hover:underline"
          >
            Limpar tudo
          </button>
        )}
      </header>

      {loading ? (
        <p className="px-1 py-8 text-center text-sm text-zinc-500">Carregando…</p>
      ) : clips.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-zinc-500">
          Nenhum replay ainda. Toque em <strong>REPLAY</strong> durante um lance
          para salvar os últimos segundos aqui.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} onDelete={remove} />
          ))}
        </div>
      )}
    </section>
  );
}
