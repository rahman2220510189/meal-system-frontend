"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ChevronDown,
  FileBarChart2,
  HandCoins,
  Home,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShoppingBasket,
  User as UserIcon,
  Users,
  UtensilsCrossed,
  Plus,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, useErrorText } from "@/lib/i18n";
import { MessProvider, useMess } from "@/lib/mess";
import { api, tokenStore } from "@/lib/api";
import type { User } from "@/lib/types";
import { Logo } from "./Logo";
import { LangToggle, ThemeToggle } from "./Toggles";
import { RequireAuth } from "./RequireAuth";
import { Badge, Button, Field, Loading, Modal, Select, cx, useFeedback } from "./ui";
import { PasswordInput } from "./AuthFrame";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; admin?: boolean; badge?: number };

function useNav(): NavItem[] {
  const { t } = useI18n();
  const { detail } = useMess();
  return [
    { href: "/dashboard", label: t.nav.dashboard, icon: Home },
    { href: "/meals", label: t.nav.meals, icon: UtensilsCrossed },
    { href: "/bazar", label: t.nav.bazar, icon: ShoppingBasket },
    { href: "/deposits", label: t.nav.deposits, icon: HandCoins },
    { href: "/costs", label: t.nav.costs, icon: ReceiptText },
    { href: "/members", label: t.nav.members, icon: Users, badge: detail?.pendingMembers || 0 },
    { href: "/reports", label: t.nav.reports, icon: FileBarChart2 },
    { href: "/activity", label: t.nav.activity, icon: Activity },
    { href: "/settings", label: t.nav.settings, icon: Settings, admin: true },
    { href: "/profile", label: t.nav.profile, icon: UserIcon },
  ];
}

function MonthPicker({ className }: { className?: string }) {
  const { months, month, setMonthId } = useMess();
  const { t, fmt } = useI18n();
  if (!months.length) return null;
  return (
    <div className={cx("relative", className)}>
      <label htmlFor="month-picker" className="sr-only">
        {t.reports.month}
      </label>
      <Select id="month-picker" value={month?.id ?? ""} onChange={(e) => setMonthId(e.target.value)} className="h-10 min-w-40 font-semibold">
        {months.map((m) => (
          <option key={m.id} value={m.id}>
            {fmt.monthName(m.year, m.month)} · {t.status[m.status]}
          </option>
        ))}
      </Select>
    </div>
  );
}

function MessSwitcher() {
  const { messes, messId, detail, switchMess } = useMess();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const approved = messes.filter((m) => m.status === "APPROVED");
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left hover:bg-surface-2"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="min-w-0">
          <span className="block truncate font-display text-[17px] font-bold leading-tight">{detail?.mess.name ?? "…"}</span>
          <span className="text-[13px] text-ink-3">{detail?.me.role === "ADMIN" ? t.common.admin : t.common.memberRole}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-ink-3" />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" className="absolute left-0 right-0 z-40 mt-1 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
            {approved.map((m) => (
              <button
                key={m.id}
                role="menuitem"
                onClick={() => {
                  switchMess(m.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left hover:bg-surface-2"
              >
                <span className="truncate">{m.name}</span>
                {m.id === messId ? <Check className="size-4 text-leaf" /> : null}
              </button>
            ))}
            <Link href="/onboarding" role="menuitem" className="mt-1 flex items-center gap-2 rounded-xl border-t border-line px-3 py-2 text-[15px] text-ink-2 hover:bg-surface-2">
              <Plus className="size-4" /> {t.nav.newMess}
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ForcePasswordChange() {
  const { user, setUser } = useAuth();
  const { t } = useI18n();
  const errText = useErrorText();
  const { toast } = useFeedback();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!user?.mustChangePassword) return null;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ token: string; user: User }>("/api/auth/change-password", { method: "POST", body: { currentPassword: cur, newPassword: next } });
      tokenStore.set(r.token);
      setUser(r.user);
      toast(t.profile.changed);
    } catch (e2) {
      setError(errText(e2));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open onClose={() => {}} title={t.profile.mustChangeTitle} description={t.profile.mustChangeBody} size="sm">
      <form onSubmit={save} className="flex flex-col gap-4 pb-2">
        <Field label={t.profile.tempPass} htmlFor="fp-cur">
          <PasswordInput id="fp-cur" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} required />
        </Field>
        <Field label={t.profile.newPass} hint={t.auth.passwordHint} htmlFor="fp-new">
          <PasswordInput id="fp-new" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={6} required />
        </Field>
        {error ? <p className="text-due" role="alert">{error}</p> : null}
        <Button type="submit" loading={busy} disabled={next.length < 6 || !cur}>
          {t.common.save}
        </Button>
      </form>
    </Modal>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const { isAdmin, noMess, loading, detail, messId, refreshMesses } = useMess();
  const nav = useNav().filter((n) => !n.admin || isAdmin);
  const [moreOpen, setMoreOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Expose the top bar height so sticky table headers sit right under it
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--topbar", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (noMess) router.replace("/onboarding");
  }, [noMess, router]);

  // If the stored mess vanished (removed), fall back to another one
  useEffect(() => {
    if (messId && !loading && !detail) {
      const tm = setTimeout(() => refreshMesses(), 1500);
      return () => clearTimeout(tm);
    }
  }, [messId, loading, detail, refreshMesses]);

  useEffect(() => setMoreOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const bottom = nav.slice(0, 4);
  const pendingTotal = nav.reduce((s, n) => s + (n.badge || 0), 0);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="no-print sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-3 py-4 lg:flex">
        <Link href="/" className="px-2">
          <Logo label={t.appName} />
        </Link>
        <div className="mt-5 border-y border-line py-2">
          <MessSwitcher />
        </div>
        <nav className="mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label={t.appName}>
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                isActive(n.href) ? "bg-leaf-soft font-semibold text-leaf" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              <n.icon className="size-5" />
              <span className="flex-1">{n.label}</span>
              {n.badge && isAdmin ? <Badge tone="turmeric">{n.badge}</Badge> : null}
            </Link>
          ))}
        </nav>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line px-1 pt-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-[13px] text-ink-3">{user?.email}</p>
          </div>
          <button onClick={signOut} className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label={t.common.signOut}>
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Top bar */}
        <header ref={headerRef} className="no-print sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <Link href="/dashboard" aria-label={t.nav.dashboard}>
                <Logo label="" className="[&>span:last-child]:hidden" />
              </Link>
              <p className="truncate font-display text-[17px] font-bold">{detail?.mess.name}</p>
            </div>
            <MonthPicker className="hidden sm:block lg:block" />
            <div className="flex items-center gap-2">
              <LangToggle className="hidden sm:inline-flex" />
              <ThemeToggle />
            </div>
          </div>
          <div className="px-4 pb-2.5 sm:hidden">
            <MonthPicker className="[&_select]:w-full" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{loading || !detail ? <Loading /> : children}</main>
      </div>

      {/* Bottom bar (phones/tablets) */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label={t.appName}>
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {bottom.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cx("flex flex-col items-center gap-0.5 py-2 text-[12px] font-semibold", isActive(n.href) ? "text-leaf" : "text-ink-3")}
            >
              <span className={cx("grid h-7 w-12 place-items-center rounded-full", isActive(n.href) && "bg-leaf-soft")}>
                <n.icon className="size-5" />
              </span>
              {n.label}
            </Link>
          ))}
          <button onClick={() => setMoreOpen(true)} className="relative flex flex-col items-center gap-0.5 py-2 text-[12px] font-semibold text-ink-3" aria-haspopup="dialog">
            <span className="grid h-7 w-12 place-items-center rounded-full">
              <Menu className="size-5" />
            </span>
            {t.nav.more}
            {pendingTotal && isAdmin ? <span className="absolute right-4 top-1.5 size-2.5 rounded-full bg-turmeric" /> : null}
          </button>
        </div>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title={t.nav.more}>
        <div className="-mx-2 border-b border-line pb-2">
          <MessSwitcher />
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {nav.slice(4).map((n) => (
            <li key={n.href}>
              <Link href={n.href} className={cx("flex items-center gap-2.5 rounded-2xl border border-line p-3 font-semibold", isActive(n.href) ? "bg-leaf-soft text-leaf" : "hover:bg-surface-2")}>
                <n.icon className="size-5" />
                <span className="flex-1">{n.label}</span>
                {n.badge && isAdmin ? <Badge tone="turmeric">{n.badge}</Badge> : null}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between gap-2">
          <LangToggle />
          <Button variant="ghost" onClick={signOut} icon={<LogOut className="size-4" />}>
            {t.common.signOut}
          </Button>
        </div>
      </Modal>

      <ForcePasswordChange />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <MessProvider>
        <Shell>{children}</Shell>
      </MessProvider>
    </RequireAuth>
  );
}
