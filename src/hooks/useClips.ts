"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearClips,
  deleteClip,
  listClips,
  subscribeClips,
} from "@/services/clipStore";
import type { StoredClip } from "@/types";

/**
 * Lista reativa de clipes do IndexedDB. Recarrega automaticamente sempre que
 * um clipe é salvo/removido (via pub/sub do clipStore).
 */
export function useClips() {
  const [clips, setClips] = useState<StoredClip[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const all = await listClips();
      setClips(all);
    } catch {
      setClips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeClips(() => void refresh());
    return unsubscribe;
  }, [refresh]);

  const remove = useCallback((id: string) => deleteClip(id), []);
  const clearAll = useCallback(() => clearClips(), []);

  return { clips, loading, remove, clearAll };
}
