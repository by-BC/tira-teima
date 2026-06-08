// Tipos compartilhados do Tira-Teima

export interface StoredClip {
  id: string;
  blob: Blob;
  mimeType: string;
  durationHint: number; // duração-alvo em segundos (informativa)
  size: number; // bytes
  createdAt: number; // epoch ms
}

export type CameraStatus =
  | "idle" // ainda não pedimos a câmera
  | "requesting" // aguardando permissão / abertura
  | "ready" // stream ativo
  | "denied" // usuário negou
  | "error"; // navegador não suporta ou falhou

export type RecorderStatus = "idle" | "recording" | "error";

export type FacingMode = "environment" | "user";
