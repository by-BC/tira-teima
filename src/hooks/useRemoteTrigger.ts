"use client";

import { useEffect, useRef } from "react";
import { createSilentLoopAudio } from "@/lib/silentAudio";

interface UseRemoteTriggerOptions {
  enabled?: boolean;
  debounceMs?: number; // evita disparo duplo de fontes simultâneas
  mediaKeys?: boolean; // registra botões de mídia (fones/Bluetooth)
}

/**
 * Agrega múltiplas fontes de disparo do replay em um único callback:
 *  - Teclado: Enter / Espaço (também cobre teclados Bluetooth e clickers HID)
 *  - Botões de mídia: play / pause / next / previous via Media Session API
 *    (fones com botão, controles Bluetooth "tipo mídia")
 *
 * O clique na tela é tratado diretamente pelo ReplayButton.
 *
 * Para que os botões de mídia de hardware cheguem aos handlers, mantemos um
 * áudio silencioso em loop que "possui" a sessão de mídia.
 */
export function useRemoteTrigger(
  onTrigger: () => void,
  options: UseRemoteTriggerOptions = {},
): void {
  const { enabled = true, debounceMs = 800, mediaKeys = true } = options;
  const lastRef = useRef(0);
  const cbRef = useRef(onTrigger);
  cbRef.current = onTrigger;

  useEffect(() => {
    if (!enabled) return;

    const fire = () => {
      const now = Date.now();
      if (now - lastRef.current < debounceMs) return;
      lastRef.current = now;
      cbRef.current();
    };

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "Spacebar" ||
        e.key === "MediaPlayPause"
      ) {
        e.preventDefault();
        fire();
      }
    };
    window.addEventListener("keydown", onKey);

    const actions: MediaSessionAction[] = [
      "play",
      "pause",
      "nexttrack",
      "previoustrack",
    ];
    let audio: HTMLAudioElement | null = null;

    if (mediaKeys && "mediaSession" in navigator) {
      try {
        audio = createSilentLoopAudio();
        void audio.play().catch(() => {});
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Tira-Teima",
          artist: "Pronto para o replay",
        });
        navigator.mediaSession.playbackState = "playing";
        for (const a of actions) {
          try {
            navigator.mediaSession.setActionHandler(a, fire);
          } catch {
            // ação não suportada neste navegador
          }
        }
      } catch {
        // Media Session indisponível
      }
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      if (mediaKeys && "mediaSession" in navigator) {
        for (const a of actions) {
          try {
            navigator.mediaSession.setActionHandler(a, null);
          } catch {
            // ignorado
          }
        }
      }
    };
  }, [enabled, debounceMs, mediaKeys]);
}
