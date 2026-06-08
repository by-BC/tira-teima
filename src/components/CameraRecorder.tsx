"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useReplayRecorder } from "@/hooks/useReplayRecorder";
import { useRemoteTrigger } from "@/hooks/useRemoteTrigger";
import { useWakeLock } from "@/hooks/useWakeLock";
import { saveClip } from "@/services/clipStore";
import { downloadBlob } from "@/services/download";
import { fileExtensionForMime } from "@/services/mediaSupport";
import { ensureMp4 } from "@/services/remux";
import { playBeep, vibrate } from "@/services/feedback";
import { clipFilename } from "@/lib/format";
import { useAuth } from "./auth/AuthProvider";
import { PermissionGate } from "./PermissionGate";
import { ReplayButton } from "./ReplayButton";
import { StatusPill } from "./StatusPill";

const BUFFER_SECONDS = 18;
const CLIP_SECONDS = 15;
const TRIM_END_SECONDS = 3;
const NEEDED_SECONDS = CLIP_SECONDS + TRIM_END_SECONDS;

interface LastSaved {
  url: string;
  blob: Blob;
  createdAt: number;
}

export function CameraRecorder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { canSaveClip, dailyLimit, recordClipSaved } = useAuth();
  const { stream, status, error, start, flip } = useCamera();
  const { state, saveReplay } = useReplayRecorder(stream, {
    bufferSeconds: BUFFER_SECONDS,
    clipSeconds: CLIP_SECONDS,
    trimEndSeconds: TRIM_END_SECONDS,
    timesliceMs: 1000,
  });
  useWakeLock(!!stream);

  const [flash, setFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<LastSaved | null>(null);
  const [cardConverting, setCardConverting] = useState(false);
  const [cardProgress, setCardProgress] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<LastSaved | null>(null);

  const countdown = Math.max(0, NEEDED_SECONDS - state.bufferedSeconds);

  // conecta o stream ao elemento de vídeo quando ele estiver pronto
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      void video.play().catch(() => {});
    }
  }, [stream]);

  // limpa timers e object URLs ao desmontar
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (lastSavedRef.current) URL.revokeObjectURL(lastSavedRef.current.url);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const handleTrigger = useCallback(async () => {
    if (saving || state.status !== "recording") return;
    if (!state.ready) {
      const remaining = Math.max(0, NEEDED_SECONDS - state.bufferedSeconds);
      showToast(`Gravando o buffer… pronto em ${remaining}s.`);
      return;
    }
    if (!canSaveClip) {
      showToast(
        `Limite diário do plano Free atingido (${dailyLimit}). Vire Pro para clipes ilimitados.`,
      );
      return;
    }
    setSaving(true);
    try {
      const blob = await saveReplay();
      if (!blob) {
        showToast("Buffer ainda curto — aguarde alguns segundos gravando.");
        return;
      }
      const clip = await saveClip(blob, CLIP_SECONDS);
      void recordClipSaved();
      setFlash(true);
      setTimeout(() => setFlash(false), 250);
      vibrate(120);
      playBeep();

      const next: LastSaved = {
        url: URL.createObjectURL(blob),
        blob,
        createdAt: clip.createdAt,
      };
      if (lastSavedRef.current) URL.revokeObjectURL(lastSavedRef.current.url);
      lastSavedRef.current = next;
      setLastSaved(next);
      showToast("Replay salvo na galeria ↓");
    } catch {
      showToast("Falha ao salvar o replay.");
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    state.status,
    state.ready,
    state.bufferedSeconds,
    saveReplay,
    showToast,
    canSaveClip,
    dailyLimit,
    recordClipSaved,
  ]);

  const dismissLastSaved = useCallback(() => {
    if (lastSavedRef.current) URL.revokeObjectURL(lastSavedRef.current.url);
    lastSavedRef.current = null;
    setLastSaved(null);
  }, []);

  const downloadLastSaved = useCallback(async () => {
    const saved = lastSavedRef.current;
    if (!saved || cardConverting) return;
    setCardConverting(true);
    setCardProgress(0);
    try {
      const out = await ensureMp4(saved.blob, { onProgress: setCardProgress });
      downloadBlob(out, clipFilename(saved.createdAt, fileExtensionForMime(out.type)));
    } catch {
      downloadBlob(
        saved.blob,
        clipFilename(saved.createdAt, fileExtensionForMime(saved.blob.type)),
      );
    } finally {
      setCardConverting(false);
      setCardProgress(0);
    }
  }, [cardConverting]);

  // gatilhos externos: teclado, botões de mídia/Bluetooth
  useRemoteTrigger(handleTrigger, { enabled: status === "ready" });

  if (status !== "ready") {
    return <PermissionGate status={status} error={error} onStart={() => start()} />;
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="h-full w-full object-cover"
      />

      {/* flash de confirmação */}
      {flash && <div className="pointer-events-none absolute inset-0 bg-white/70" />}

      {/* status no topo */}
      <div className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))]">
        <StatusPill
          recording={state.status === "recording"}
          bufferSeconds={BUFFER_SECONDS}
        />
      </div>

      {/* trocar câmera */}
      <button
        onClick={flip}
        aria-label="Trocar câmera"
        className="absolute right-[calc(1rem+env(safe-area-inset-right))] top-[calc(1rem+env(safe-area-inset-top))] grid h-10 w-10 place-items-center rounded-full bg-black/60 text-lg text-white backdrop-blur transition active:scale-95"
      >
        ⟳
      </button>

      {/* erro do gravador */}
      {state.status === "error" && state.error && (
        <div className="absolute inset-x-4 top-16 rounded-lg bg-red-600 px-3 py-2 text-center text-sm text-white">
          {state.error}
        </div>
      )}

      {/* card do último replay salvo: deixa óbvio que funcionou e onde está */}
      {lastSaved && (
        <div className="absolute left-1/2 top-[calc(4rem+env(safe-area-inset-top))] w-[90%] max-w-sm -translate-x-1/2 rounded-xl bg-zinc-900/95 p-2 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3">
            <video
              src={lastSaved.url}
              muted
              playsInline
              preload="metadata"
              className="h-16 w-24 shrink-0 rounded-lg bg-black object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Replay salvo! ✅</p>
              <p className="truncate text-xs text-zinc-400">
                Está na galeria, abaixo da câmera.
              </p>
            </div>
            <button
              onClick={downloadLastSaved}
              disabled={cardConverting}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-60"
            >
              {cardConverting ? `${Math.round(cardProgress * 100)}%` : "Baixar"}
            </button>
            <button
              onClick={dismissLastSaved}
              aria-label="Fechar"
              className="rounded-lg bg-zinc-700 px-2 py-2 text-xs font-semibold text-white transition active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="absolute bottom-44 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white backdrop-blur">
          {toast}
        </div>
      )}

      {/* botão de replay */}
      <div className="absolute inset-x-0 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] flex justify-center">
        <ReplayButton
          onTrigger={handleTrigger}
          disabled={state.status !== "recording"}
          saving={saving}
          ready={state.ready}
          countdown={countdown}
          clipSeconds={CLIP_SECONDS}
        />
      </div>

      {/* dica contextual */}
      <p className="absolute inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] text-center text-[11px] text-white/60">
        {state.ready
          ? `Salva os ${CLIP_SECONDS}s anteriores · descarta os últimos ${TRIM_END_SECONDS}s`
          : `Enchendo o buffer — REPLAY libera em ${countdown}s`}
      </p>
    </div>
  );
}
