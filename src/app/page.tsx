"use client";
import Link from "next/link";
import { Check, CircleDollarSign, ClipboardCheck, CookingPot, FileDown, ShieldCheck, Users, UtensilsCrossed } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LangToggle, ThemeToggle } from "@/components/Toggles";
import { cx } from "@/components/ui";
import { SITE_URL } from "@/lib/site";

const featureIcons = [UtensilsCrossed, Users, ClipboardCheck, CircleDollarSign, CookingPot, FileDown];

// A believable week from a real ledger: lunch / dinner per day
const demoWeek: [boolean, boolean][] = [
  [true, true],
  [true, true],
  [false, true],
  [true, true],
  [false, false],
  [true, true],
  [true, false],
];

function DemoLedger() {
  const { t, fmt } = useI18n();
  return (
    <div className="relative">
      <div className="absolute -inset-3 -rotate-2 rounded-[28px] bg-leaf/10" aria-hidden />
      <div className="relative rounded-3xl border border-line bg-surface p-5 shadow-[0_24px_60px_-28px_rgba(14,90,71,0.45)] sm:p-6">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold">{t.landing.demoTitle}</p>
          <span className="rounded-full bg-plus-soft px-2.5 py-0.5 text-[13px] font-semibold text-plus">{t.status.OPEN}</span>
        </div>
        <div className="mt-4 ledger-rule" role="img" aria-label={t.meals.title}>
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 text-[13px] font-semibold text-ink-3 h-11">
            <span>{t.common.date}</span>
            <span className="w-9 text-center">{t.meal.lunch}</span>
            <span className="w-9 text-center">{t.meal.dinner}</span>
          </div>
          {demoWeek.map(([l, d], i) => (
            <div key={i} className="grid h-11 grid-cols-[1fr_auto_auto] items-center gap-x-4">
              <span className="text-[15px] text-ink-2 tabular">{fmt.date(`2026-11-${String(i + 3).padStart(2, "0")}`, "day")}</span>
              {[l, d].map((on, j) => (
                <span key={j} className="plate !size-9" data-on={on}>
                  {on ? <Check className="size-4" strokeWidth={3} /> : null}
                </span>
              ))}
            </div>
          ))}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface-2 p-3.5">
            <dt className="text-[13px] text-ink-3">{t.landing.demoRate}</dt>
            <dd className="font-display text-2xl font-bold tabular">{fmt.money(42.5)}</dd>
          </div>
          <div className="rounded-2xl bg-plus-soft p-3.5">
            <dt className="text-[13px] text-plus">{t.landing.demoYou}</dt>
            <dd className="font-display text-2xl font-bold text-plus tabular">{fmt.money(320, { sign: true })}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default function Landing() {
  const { t } = useI18n();
  const { user, ready } = useAuth();
  const L = t.landing;
  const loggedIn = ready && !!user;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Meal System — মিল সিস্টেম",
    url: SITE_URL,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, Android, iOS",
    inLanguage: ["bn", "en"],
    description: "মেস ও হোস্টেলের মিল, বাজার, মিল রেট আর ডিউ-প্লাসের হিসাব। Mess meal, bazar and balance tracker.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "BDT" },
  };

  return (
    <div className="min-h-dvh">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" aria-label={t.appName}>
          <Logo label={t.appName} />
        </Link>
        <nav className="flex items-center gap-2">
          <LangToggle className="hidden sm:inline-flex" />
          <ThemeToggle />
          {loggedIn ? (
            <Link href="/dashboard" className="inline-flex h-10 items-center rounded-xl bg-leaf px-4 text-[15px] font-semibold text-white dark:text-[#06140f]">
              {t.nav.dashboard}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden h-10 items-center rounded-xl px-3 text-[15px] font-semibold text-ink-2 hover:text-ink sm:inline-flex">
                {L.navLogin}
              </Link>
              <Link href="/register" className="inline-flex h-10 items-center rounded-xl bg-leaf px-4 text-[15px] font-semibold text-white dark:text-[#06140f]">
                {L.navStart}
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-14">
          <div className="hero-rise">
            <h1 className="font-display text-[40px] font-extrabold leading-[1.1] text-ink sm:text-[56px] lg:text-[64px]">{L.heroTitle}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">{L.heroBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={loggedIn ? "/onboarding" : "/register"}
                className="inline-flex h-13 items-center rounded-2xl bg-leaf px-6 text-base font-bold text-white hover:bg-leaf-2 dark:text-[#06140f]"
              >
                {L.ctaCreate}
              </Link>
              <Link
                href={loggedIn ? "/onboarding" : "/register?join=1"}
                className="inline-flex h-13 items-center rounded-2xl border border-line bg-surface px-6 text-base font-bold text-ink hover:bg-surface-2"
              >
                {L.ctaJoin}
              </Link>
            </div>
            <LangToggle className="mt-6 sm:hidden" />
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <DemoLedger />
          </div>
        </section>

        {/* Features as a ruled list */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">{L.whyTitle}</h2>
            <ul className="mt-10 grid gap-x-12 sm:grid-cols-2">
              {L.features.map((f, i) => {
                const Icon = featureIcons[i];
                return (
                  <li key={f.title} className="flex gap-4 border-t border-line py-6">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-turmeric-soft text-turmeric-ink">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-ink">{f.title}</h3>
                      <p className="mt-1 text-ink-2">{f.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Steps: a real sequence, so numbered */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{L.stepsTitle}</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {L.steps.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="font-display text-5xl font-extrabold text-turmeric">{["১", "২", "৩"][i]}</span>
                <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                <p className="mt-1.5 text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Trust */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 rounded-3xl bg-leaf p-8 text-white sm:p-12 md:flex-row md:items-center dark:text-[#06140f]">
            <ShieldCheck className="size-14 shrink-0 text-turmeric" strokeWidth={1.6} />
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">{L.trustTitle}</h2>
              <p className="mt-2 max-w-2xl text-white/85 dark:text-[#06140f]/80">{L.trustBody}</p>
            </div>
          </div>
        </section>

        {/* Final call */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{L.finalTitle}</h2>
          <p className="mt-3 text-lg text-ink-2">{L.finalBody}</p>
          <Link
            href={loggedIn ? "/dashboard" : "/register"}
            className={cx("mt-8 inline-flex h-13 items-center rounded-2xl bg-turmeric px-7 text-base font-bold text-[#2b1d00] hover:brightness-105")}
          >
            {loggedIn ? t.nav.dashboard : L.ctaCreate}
          </Link>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-ink-3 sm:flex-row sm:px-6">
          <Logo label={t.appName} className="scale-90" />
          <p>{L.footer}</p>
          <p className="tabular">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
