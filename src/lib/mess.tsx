"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "./api";
import type { MessDetail, MessListItem, Month } from "./types";

const MESS_KEY = "ms_mess";

type Ctx = {
  messes: MessListItem[];
  messId: string | null;
  detail: MessDetail | null;
  isAdmin: boolean;
  months: Month[];
  month: Month | null;
  setMonthId: (id: string) => void;
  switchMess: (id: string) => void;
  refreshDetail: () => Promise<unknown>;
  refreshMesses: () => Promise<unknown>;
  loading: boolean;
  noMess: boolean;
};

const MessContext = createContext<Ctx | null>(null);

export function MessProvider({ children }: { children: React.ReactNode }) {
  const list = useSWR<{ messes: MessListItem[] }>("/api/messes", fetcher);
  const approved = useMemo(() => (list.data?.messes ?? []).filter((m) => m.status === "APPROVED"), [list.data]);

  const [messId, setMessId] = useState<string | null>(null);
  const [monthId, setMonthIdState] = useState<string | null>(null);

  useEffect(() => {
    if (!list.data) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(MESS_KEY);
    } catch {
      /* ignore */
    }
    const pick = approved.find((m) => m.id === stored)?.id ?? approved[0]?.id ?? null;
    setMessId(pick);
  }, [list.data, approved]);

  const detail = useSWR<MessDetail>(messId ? `/api/messes/${messId}` : null, fetcher);

  // Default to the open month, else the latest
  useEffect(() => {
    const ms = detail.data?.months;
    if (!ms?.length) return;
    if (monthId && ms.some((m) => m.id === monthId)) return;
    setMonthIdState((ms.find((m) => m.status === "OPEN") ?? ms[0]).id);
  }, [detail.data, monthId]);

  const switchMess = useCallback((id: string) => {
    try {
      localStorage.setItem(MESS_KEY, id);
    } catch {
      /* ignore */
    }
    setMonthIdState(null);
    setMessId(id);
  }, []);

  const months = useMemo(() => detail.data?.months ?? [], [detail.data]);
  const month = months.find((m) => m.id === monthId) ?? null;

  const value: Ctx = {
    messes: list.data?.messes ?? [],
    messId,
    detail: detail.data ?? null,
    isAdmin: detail.data?.me.role === "ADMIN",
    months,
    month,
    setMonthId: setMonthIdState,
    switchMess,
    refreshDetail: () => detail.mutate(),
    refreshMesses: () => list.mutate(),
    loading: list.isLoading || (!!messId && detail.isLoading),
    noMess: !!list.data && approved.length === 0,
  };
  return <MessContext.Provider value={value}>{children}</MessContext.Provider>;
}

export function useMess() {
  const c = useContext(MessContext);
  if (!c) throw new Error("useMess outside provider");
  return c;
}

/** Path helper: /api/messes/:messId + suffix */
export function useMessPath() {
  const { messId } = useMess();
  return (suffix: string) => (messId ? `/api/messes/${messId}${suffix}` : null);
}
