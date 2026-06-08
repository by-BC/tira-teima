// Remux/transcode do clipe para MP4 (H.264/AAC) usando ffmpeg.wasm.
//
// Por quê: o clipe capturado pelo MediaRecorder é montado por concatenação
// (header + janela de chunks). Reproduz no Chrome, mas pode ter metadados de
// duração/seek imprecisos e, em WebM, não toca no iOS/Safari. Ao exportar,
// geramos um MP4 limpo, seekável e compatível com qualquer player.
//
// Carregamento é preguiçoso (só ao baixar o 1º clipe) e usa o core
// single-thread, que NÃO exige cross-origin isolation (COOP/COEP).

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

const CORE_VERSION = "0.12.6";
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;
let progressCb: ((ratio: number) => void) | null = null;

export function isRemuxSupported(): boolean {
  return typeof window !== "undefined" && typeof WebAssembly !== "undefined";
}

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  if (!loadPromise) {
    loadPromise = (async () => {
      const instance = new FFmpeg();
      instance.on("progress", ({ progress }) => {
        if (progressCb) progressCb(Math.max(0, Math.min(1, progress)));
      });
      await instance.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      ffmpeg = instance;
      return instance;
    })();
  }
  return loadPromise;
}

export interface RemuxOptions {
  onProgress?: (ratio: number) => void;
}

/** Transcodifica um Blob de vídeo para MP4 H.264/AAC (faststart). */
export async function remuxToMp4(input: Blob, opts: RemuxOptions = {}): Promise<Blob> {
  const instance = await getFFmpeg();
  const inName = "input";
  const outName = "output.mp4";

  progressCb = opts.onProgress ?? null;
  try {
    await instance.writeFile(inName, new Uint8Array(await input.arrayBuffer()));
    await instance.exec([
      "-i", inName,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outName,
    ]);
    const data = (await instance.readFile(outName)) as Uint8Array;
    await instance.deleteFile(inName).catch(() => {});
    await instance.deleteFile(outName).catch(() => {});
    // copia para um Uint8Array com ArrayBuffer "normal" (evita SharedArrayBuffer,
    // que não é um BlobPart válido nas libs recentes do TS)
    const bytes = new Uint8Array(data.byteLength);
    bytes.set(data);
    return new Blob([bytes], { type: "video/mp4" });
  } finally {
    progressCb = null;
  }
}

/**
 * Garante um Blob MP4 para download. Se já for MP4 (ex.: iOS) devolve como está;
 * se o remux não for suportado/falhar, devolve o original (melhor baixar algo).
 */
export async function ensureMp4(
  input: Blob,
  opts: RemuxOptions = {},
): Promise<Blob> {
  if (input.type.includes("mp4")) return input;
  if (!isRemuxSupported()) return input;
  return remuxToMp4(input, opts);
}
