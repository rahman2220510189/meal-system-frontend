"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <div className="mx-auto mb-6 flex justify-center gap-2" aria-hidden>
          <span className="plate" data-on="true" />
          <span className="plate" data-on="false" />
          <span className="plate" data-on="true" />
        </div>
        <h1 className="font-display text-4xl font-bold">{t.notFound.title}</h1>
        <p className="mt-2 text-ink-2">{t.notFound.body}</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-leaf px-5 font-semibold text-white dark:text-[#06140f]">
          {t.notFound.home}
        </Link>
      </div>
    </main>
  );
}
