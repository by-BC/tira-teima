"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickMimeType } from "@/services/mediaSupport";
import type { RecorderStatus } from "@/types";

export interface ReplayRecorderOptions {
  bufferSeconds?: number; // total retido em memória (default 18)
  clipSeconds?: number; // tamanho do clipe exportado (default 15)
  trimEndSeconds?: number; // descartado do fim (default 3)
  timesliceMs?: number; // granularidade do corte (default 1000)
  mimeType?: string; // força um codec específico
}

interface TimedChunk {
  blob: Blob;
  t: number; // performance.now() na chegada
}

export interface ReplayRecorderState {
  status: RecorderStatus;
  error?: string;
  mimeType?: string;
  bufferSeconds: number;
  clipSeconds: number;
  trimEndSeconds: number;
  /** true quando há buffer suficiente (clip + trim) para gerar um clipe completo */
  ready: boolean;
  /** segundos de conteúdo já acumulados no buffer (limitado a bufferSeconds) */
  bufferedSeconds: number;
}

/**
 * Buffer circular de vídeo via MediaRecorder.
 *
 * Detalhe crítico: em WebM/MP4, apenas o PRIMEIRO chunk emitido carrega o
 * cabeçalho do container (codecs, tracks). Os demais são clusters de mídia que
 * só são decodificáveis junto com esse cabeçalho. Por isso guardamos o header
 * para sempre e mantemos uma janela deslizante dos chunks recentes — nunca
 * descartamos o header.
 *
 * `saveReplay()` recorta a janela [agora-18s, agora-3s] e monta um Blob com
 * header + chunks selecionados.
 */
export function useReplayRecorder(
  stream: MediaStream | null,
  options: ReplayRecorderOptions = {},
) {
  const {
    bufferSeconds = 18,
    clipSeconds = 15,
    trimEndSeconds = 3,
    timesliceMs = 1000,
    mimeType,
  } = options;

  const recorderRef = useRef<MediaRecorder | null>(null);
  const headerRef = useRef<Blob | null>(null); // 1º chunk = cabeçalho do container
  const chunksRef = useRef<TimedChunk[]>([]);

  const [state, setState] = useState<ReplayRecorderState>({
    status: "idle",
    bufferSeconds,
    clipSeconds,
    trimEndSeconds,
    ready: false,
    bufferedSeconds: 0,
  });

  const prune = useCallback(() => {
    const min = performance.now() - (bufferSeconds + 2) * 1000; // +2s de margem
    const chunks = chunksRef.current;
    let i = 0;
    while (i < chunks.length && chunks[i].t < min) i++;
    if (i > 0) chunksRef.current = chunks.slice(i);
  }, [bufferSeconds]);

  useEffect(() => {
    if (!stream) return;

    const resolved = pickMimeType(mimeType);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(
        stream,
        resolved ? { mimeType: resolved } : undefined,
      );
    } catch {
      setState((s) => ({
        ...s,
        status: "error",
        error: "Gravação não suportada neste navegador (MediaRecorder).",
      }));
      return;
    }

    // reinicia o buffer para este stream
    headerRef.current = null;
    chunksRef.current = [];

    recorder.ondataavailable = (ev: BlobEvent) => {
      if (!ev.data || ev.data.size === 0) return;
      if (!headerRef.current) {
        headerRef.current = ev.data; // primeiro chunk = header
      } else {
        chunksRef.current.push({ blob: ev.data, t: performance.now() });
        prune();
      }
    };
    recorder.onerror = () =>
      setState((s) => ({ ...s, status: "error", error: "Erro durante a gravação." }));

    recorder.start(timesliceMs);
    recorderRef.current = recorder;

    // marca o início e zera o progresso do buffer para este stream
    const startTime = performance.now();
    const neededSeconds = clipSeconds + trimEndSeconds; // 18s por padrão
    setState((s) => ({
      ...s,
      status: "recording",
      error: undefined,
      mimeType: resolved,
      ready: false,
      bufferedSeconds: 0,
    }));

    // tique de progresso até o buffer encher (depois para, para não re-renderizar à toa)
    const tick = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      const buffered = Math.min(elapsed, bufferSeconds);
      const ready = elapsed >= neededSeconds;
      setState((s) => ({ ...s, bufferedSeconds: Math.floor(buffered), ready }));
      if (ready) clearInterval(tick);
    }, 500);

    return () => {
      clearInterval(tick);
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        // ignorado
      }
      recorderRef.current = null;
    };
  }, [stream, mimeType, timesliceMs, prune, bufferSeconds, clipSeconds, trimEndSeconds]);

  /**
   * Monta o clipe: janela de `clipSeconds` que termina `trimEndSeconds` atrás.
   * Retorna null se o buffer ainda não acumulou conteúdo suficiente.
   */
  const saveReplay = useCallback(async (): Promise<Blob | null> => {
    const header = headerRef.current;
    const chunks = chunksRef.current;
    if (!header || chunks.length === 0) return null;

    const end = performance.now() - trimEndSeconds * 1000;
    const start = end - clipSeconds * 1000;

    const selected = chunks
      .filter((c) => c.t >= start && c.t <= end)
      .map((c) => c.blob);

    if (selected.length === 0) return null;

    const type = state.mimeType || header.type || "video/webm";
    return new Blob([header, ...selected], { type });
  }, [trimEndSeconds, clipSeconds, state.mimeType]);

  return { state, saveReplay };
}
