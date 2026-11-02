"use client";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { cx } from "./ui";

export function LangToggle({ className }: { className?: string }) {
  const { lang, t } = useI18n();
  const { changeLanguage } = useAuth();
  return (
    <div role="radiogroup" aria-label={t.common.language} className={cx("inline-flex rounded-full border border-line bg-surface p-0.5 text-sm font-semibold", className)}>
      {(["bn", "en"] as const).map((l) => (
        <button
          key={l}
          role="radio"
          aria-checked={lang === l}
          onClick={() => changeLanguage(l)}
          className={cx("rounded-full px-3 py-1 transition-colors", lang === l ? "bg-leaf text-white dark:text-[#06140f]" : "text-ink-2 hover:text-ink")}
        >
          {l === "bn" ? "বাংলা" : "EN"}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  return (
    <button
      onClick={toggle}
      className={cx("grid size-9 place-items-center rounded-full border border-line bg-surface text-ink-2 hover:text-ink", className)}
      aria-label={`${t.common.theme}: ${theme === "dark" ? t.common.dark : t.common.light}`}
    >
      {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
