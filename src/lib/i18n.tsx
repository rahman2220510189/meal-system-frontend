"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, type Dict, type Lang } from "./dict";

const LANG_KEY = "ms_lang";

type Fmt = {
  num: (n: number, maxDigits?: number) => string;
  money: (n: number, opts?: { sign?: boolean }) => string;
  int: (n: number) => string;
  date: (d: string, style?: "short" | "long" | "day") => string;
  monthName: (year: number, month: number) => string;
  dateTime: (iso: string | Date) => string;
  time: (hm: string) => string;
};

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void; fmt: Fmt };
const I18nContext = createContext<Ctx | null>(null);

export function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "bn" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return "bn";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");

  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const t = dictionaries[lang];
    const locale = lang === "bn" ? "bn-BD" : "en-US";
    const nf = (max: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: max, minimumFractionDigits: 0 });
    const fmt: Fmt = {
      num: (n, max = 2) => nf(max).format(n),
      int: (n) => nf(0).format(n),
      money: (n, opts) => {
        const abs = nf(2).format(Math.abs(n));
        const sign = n < 0 ? "−" : opts?.sign && n > 0 ? "+" : "";
        return `${sign}৳${abs}`;
      },
      date: (d, style = "short") => {
        const [y, m, day] = d.split("-").map(Number);
        const wd = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
        const dn = nf(0).format(day);
        if (style === "day") return `${dn} ${t.weekdays[wd]}`;
        if (style === "long") return `${dn} ${t.months[m - 1]} ${new Intl.NumberFormat(locale, { useGrouping: false }).format(y)}, ${t.weekdays[wd]}`;
        return `${dn} ${t.months[m - 1]}`;
      },
      monthName: (y, m) => `${t.months[m - 1]} ${new Intl.NumberFormat(locale, { useGrouping: false }).format(y)}`,
      time: (hm) => {
        const [h, m] = hm.split(":").map(Number);
        return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
      },
      dateTime: (iso) => {
        const d = typeof iso === "string" ? new Date(iso) : iso;
        return new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Dhaka",
        }).format(d);
      },
    };
    return { lang, t, setLang, fmt };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}

/** Translates an API error code; falls back to the server message. */
export function useErrorText() {
  const { t } = useI18n();
  return (e: unknown) => {
    const err = e as { code?: string; message?: string };
    if (err?.code && t.errors[err.code]) return t.errors[err.code];
    return err?.message || t.errors.SERVER_ERROR;
  };
}

/** Current date (YYYY-MM-DD) and time (HH:MM) in Bangladesh, from the device clock. */
export function dhakaNow(): { today: string; now: string } {
  const d = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const now = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return { today, now };
}

export function addDays(d: string, n: number): string {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
