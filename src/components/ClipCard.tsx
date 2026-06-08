"use client";

import { useEffect, useMemo, useState } from "react";
import { downloadBlob } from "@/services/download";
import { fileExtensionForMime } from "@/services/mediaSupport";
import { ensureMp4 } from "@/services/remux";
import { clipFilename, formatBytes, formatDateTime } from "@/lib/format";
import type { StoredClip } from "@/types";

interface ClipCardProps {
  clip: StoredClip;
  onDelete: (id: string) => void;
}

export function ClipCard({ clip, onDelete }: ClipCardProps) {
  const url = useMemo(() => URL.createObjectURL(clip.blob), [clip.blob]);
  const [confirming, setConfirming] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const handleDownload = async () => {
    if (converting) return;
    setConverting(true);
    setProgress(0);
    try {
      const out = await ensureMp4(clip.blob, { onProgress: setProgress });
      const ext = fileExtensionForMime(out.type);
      downloadBlob(out, clipFilename(clip.createdAt, ext));
    } catch {
      // fallback: baixa o original se a conversão falhar
      const ext = fileExtensionForMime(clip.mimeType);
      downloadBlob(clip.blob, clipFilename(clip.createdAt, ext));
    } finally {
      setConverting(false);
      setProgress(0);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl bg-zinc-900">
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-black"
      />
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{formatDateTime(clip.createdAt)}</span>
          <span>{formatBytes(clip.size)}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={converting}
            className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
          >
            {converting
              ? `Convertendo ${Math.round(progress * 100)}%`
              : "Baixar MP4"}
          </button>
          {confirming ? (
            <button
              onClick={() => onDelete(clip.id)}
              className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white transition active:scale-95"
            >
              Confirmar
            </button>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              onBlur={() => setConfirming(false)}
              className="rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold text-white transition active:scale-95"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
