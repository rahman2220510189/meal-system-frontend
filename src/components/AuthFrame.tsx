"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Logo } from "./Logo";
import { LangToggle, ThemeToggle } from "./Toggles";
import { Input } from "./ui";

export function AuthFrame({ title, body, children, footer }: { title: string; body: string; children: ReactNode; footer: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-leaf p-12 text-white lg:flex lg:flex-col lg:justify-between dark:text-[#06140f]">
        <Link href="/" className="relative z-10">
          <span className="font-display text-2xl font-bold">{t.appName}</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="font-display text-4xl font-bold leading-tight">{t.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3" aria-hidden>
            {[1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1].map((on, i) => (
              <span key={i} className="plate !size-10 !border-white/30" data-on={!!on} style={on ? {} : { background: "transparent" }} />
            ))}
          </div>
        </div>
        <svg className="absolute -bottom-24 -right-24 size-[420px] text-white/[0.06]" viewBox="0 0 40 40" aria-hidden>
          <path d="M4 30C4 14 16 4 36 4c0 20-10 32-26 32-3.5 0-6-2.5-6-6Z" fill="currentColor" />
        </svg>
      </aside>
      <main className="flex flex-col px-4 py-5 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible">
            <Logo label={t.appName} />
          </Link>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-1.5 text-ink-2">{body}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-[15px] text-ink-2">{footer}</div>
        </div>
      </main>
    </div>
  );
}

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const { t } = useI18n();
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-ink-3 hover:text-ink"
        aria-label={show ? t.auth.hidePassword : t.auth.showPassword}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
