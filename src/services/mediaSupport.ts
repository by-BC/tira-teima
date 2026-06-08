// Detecção de capacidades de mídia do navegador.

const CANDIDATE_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4", // Safari/iOS
];

/**
 * Escolhe o melhor mimeType suportado pelo MediaRecorder.
 * Retorna `undefined` se nenhum candidato for suportado (deixa o navegador decidir).
 */
export function pickMimeType(preferred?: string): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [preferred, ...CANDIDATE_MIME_TYPES].filter(Boolean) as string[];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}

export function hasMediaRecorder(): boolean {
  return typeof MediaRecorder !== "undefined";
}

export function hasGetUserMedia(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  // iPadOS recente se identifica como Mac; checamos touch para cobrir esse caso.
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function fileExtensionForMime(mime: string | undefined): string {
  if (!mime) return "webm";
  return mime.includes("mp4") ? "mp4" : "webm";
}
