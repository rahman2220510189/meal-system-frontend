"use client";
import { useEffect, useState } from "react";
import { SWRConfig } from "swr";
import { CloudSun, WifiOff } from "lucide-react";
import { fetcher, onSlowChange } from "@/lib/api";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { FeedbackProvider } from "./ui";

function ConnectionBanner() {
  const { t } = useI18n();
  const [slow, setSlow] = useState(false);
  const [offline, setOffline] = useState(false);
  useEffect(() => onSlowChange(setSlow), []);
  useEffect(() => {
    const up = () => setOffline(false);
    const down = () => setOffline(true);
    setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  if (!slow && !offline) return null;
  return (
    <div className="no-print fixed inset-x-0 top-0 z-[70] flex justify-center px-3 pt-3" role="status">
      <div className="sheet-in flex items-center gap-2.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper shadow-lg">
        {offline ? <WifiOff className="size-4 text-turmeric" /> : <CloudSun className="size-4 animate-pulse text-turmeric" />}
        {offline ? t.common.offline : t.common.serverWaking}
      </div>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        dedupingInterval: 3000,
        shouldRetryOnError: (err) => !err?.status || err.status >= 500,
        errorRetryCount: 3,
      }}
    >
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <FeedbackProvider>
              <ConnectionBanner />
              {children}
            </FeedbackProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
