"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (apenas em produção, para não atrapalhar o HMR do
 * dev server). Renderiza nada.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // falha silenciosa: o app funciona sem o SW
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
