"use client";

import { useEffect, useRef } from "react";

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

/**
 * Mantém a tela acesa enquanto `active` for true (Screen Wake Lock API).
 * Re-adquire o lock ao voltar do background (o navegador o libera ao trocar de
 * aba/bloquear a tela). Sem suporte (ex.: iOS < 16.4) é um no-op silencioso.
 */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (!active) return;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
    };
    if (!nav.wakeLock) return;

    let cancelled = false;

    const request = async () => {
      try {
        const sentinel = await nav.wakeLock!.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        // ignorado: pode falhar se a aba não estiver visível
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, [active]);
}
