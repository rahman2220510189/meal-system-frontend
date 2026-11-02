"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { api, onUnauthorized, tokenStore } from "./api";
import { useI18n } from "./i18n";
import type { User } from "./types";
import type { Lang } from "./dict";

type Ctx = {
  user: User | null;
  ready: boolean;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
  setUser: (u: User) => void;
  changeLanguage: (l: Lang) => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const { setLang } = useI18n();
  const { mutate } = useSWRConfig();

  const clearCache = useCallback(() => mutate(() => true, undefined, { revalidate: false }), [mutate]);

  const signOut = useCallback(() => {
    tokenStore.set(null);
    try {
      localStorage.removeItem("ms_mess");
    } catch {
      /* ignore */
    }
    setUserState(null);
    clearCache();
  }, [clearCache]);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setReady(true);
      return;
    }
    api<{ user: User }>("/api/auth/me")
      .then((r) => {
        setUserState(r.user);
        setLang(r.user.language);
      })
      .catch((e) => {
        if (e?.status === 401) tokenStore.set(null);
      })
      .finally(() => setReady(true));
  }, [setLang]);

  useEffect(() => onUnauthorized(signOut), [signOut]);

  const signIn = useCallback(
    (token: string, u: User) => {
      clearCache();
      tokenStore.set(token);
      setUserState(u);
      setLang(u.language);
    },
    [setLang, clearCache],
  );

  const changeLanguage = useCallback(
    async (l: Lang) => {
      setLang(l);
      if (user) {
        try {
          const r = await api<{ user: User }>("/api/auth/me", { method: "PATCH", body: { language: l } });
          setUserState(r.user);
        } catch {
          /* language still switches locally */
        }
      }
    },
    [user, setLang],
  );

  const value = useMemo(
    () => ({ user, ready, signIn, signOut, setUser: setUserState, changeLanguage }),
    [user, ready, signIn, signOut, changeLanguage],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
