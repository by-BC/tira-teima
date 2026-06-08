"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  id: string;
  full_name: string;
  cpf: string | null;
  email: string | null;
  plan: "free" | "pro";
  role: "user" | "admin";
  created_at: string;
}

export const DAILY_LIMIT = 10;

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  clipsToday: number;
  dailyLimit: number;
  isPro: boolean;
  isAdmin: boolean;
  remaining: number; // Infinity para Pro
  canSaveClip: boolean;
  recordClipSaved: () => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clipsToday, setClipsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadProfileAndCount = useCallback(
    async (uid: string) => {
      const [{ data: prof }, { data: count }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.rpc("clips_today"),
      ]);
      setProfile((prof as Profile) ?? null);
      setClipsToday(typeof count === "number" ? count : 0);
    },
    [supabase],
  );

  const refresh = useCallback(async () => {
    const {
      data: { user: current },
    } = await supabase.auth.getUser();
    setUser(current);
    if (current) await loadProfileAndCount(current.id);
    else {
      setProfile(null);
      setClipsToday(0);
    }
    setLoading(false);
  }, [supabase, loadProfileAndCount]);

  useEffect(() => {
    void refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const current = session?.user ?? null;
      setUser(current);
      if (current) void loadProfileAndCount(current.id);
      else {
        setProfile(null);
        setClipsToday(0);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, refresh, loadProfileAndCount]);

  const isPro = profile?.plan === "pro";
  const isAdmin = profile?.role === "admin";
  const remaining = isPro ? Infinity : Math.max(0, DAILY_LIMIT - clipsToday);
  const canSaveClip = isPro || remaining > 0;

  const recordClipSaved = useCallback(async () => {
    if (!user) return;
    setClipsToday((c) => c + 1); // atualização otimista
    const { error } = await supabase
      .from("clip_events")
      .insert({ user_id: user.id });
    if (error) await loadProfileAndCount(user.id); // reconcilia se falhar
  }, [supabase, user, loadProfileAndCount]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setClipsToday(0);
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        clipsToday,
        dailyLimit: DAILY_LIMIT,
        isPro,
        isAdmin,
        remaining,
        canSaveClip,
        recordClipSaved,
        refresh,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
