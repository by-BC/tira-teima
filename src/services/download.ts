// Dispara o download de um Blob no navegador.

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // libera a URL depois que o navegador iniciou o download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
