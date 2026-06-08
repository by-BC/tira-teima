"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hasGetUserMedia } from "@/services/mediaSupport";
import type { CameraStatus, FacingMode } from "@/types";

interface UseCameraResult {
  stream: MediaStream | null;
  status: CameraStatus;
  error: string | null;
  facingMode: FacingMode;
  start: (mode?: FacingMode) => Promise<void>;
  stop: () => void;
  flip: () => void;
}

/**
 * Gerencia o MediaStream da câmera. `start()` deve ser chamado a partir de um
 * gesto do usuário (toque no botão) — isso garante o prompt de permissão e
 * habilita áudio/vídeo de forma confiável no iOS.
 */
export function useCamera(): UseCameraResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    setStatus("idle");
  }, []);

  const start = useCallback(
    async (mode: FacingMode = facingMode) => {
      if (!hasGetUserMedia()) {
        setStatus("error");
        setError(
          "Este navegador não suporta acesso à câmera. Tente o Chrome no Android ou Safari no iOS, sempre via HTTPS.",
        );
        return;
      }
      setStatus("requesting");
      setError(null);
      try {
        const next = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });
        // encerra o stream anterior (ex.: ao trocar de câmera)
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = next;
        setStream(next);
        setFacingMode(mode);
        setStatus("ready");
      } catch (e) {
        const name = (e as DOMException)?.name;
        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("denied");
          setError(
            "Permissão de câmera negada. Libere o acesso à câmera nas configurações do navegador e tente de novo.",
          );
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setStatus("error");
          setError("Nenhuma câmera compatível foi encontrada neste dispositivo.");
        } else {
          setStatus("error");
          setError("Não foi possível acessar a câmera. Verifique se outro app não está usando-a.");
        }
      }
    },
    [facingMode],
  );

  const flip = useCallback(() => {
    void start(facingMode === "environment" ? "user" : "environment");
  }, [facingMode, start]);

  // libera a câmera ao desmontar
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  return { stream, status, error, facingMode, start, stop, flip };
}
