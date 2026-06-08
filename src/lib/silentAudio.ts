// Gera um <audio> com loop silencioso para manter a Media Session ativa.
// Necessário para que botões de mídia de fones/controles Bluetooth disparem
// os handlers de `navigator.mediaSession`. O WAV é gerado em runtime para não
// precisarmos de um asset binário no repositório.

let cachedDataUri: string | null = null;

function buildSilentWav(seconds = 1, sampleRate = 8000): string {
  const numSamples = seconds * sampleRate;
  const blockAlign = 1; // 8-bit mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // subchunk1 size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 8, true); // bits por amostra
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  // 8-bit PCM: silêncio = 128
  for (let i = 0; i < numSamples; i++) view.setUint8(44 + i, 128);

  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return "data:audio/wav;base64," + btoa(binary);
}

export function createSilentLoopAudio(): HTMLAudioElement {
  if (!cachedDataUri) cachedDataUri = buildSilentWav();
  const audio = document.createElement("audio");
  audio.loop = true;
  audio.volume = 0;
  audio.preload = "auto";
  audio.src = cachedDataUri;
  // mantém fora do fluxo visual
  audio.setAttribute("aria-hidden", "true");
  return audio;
}
