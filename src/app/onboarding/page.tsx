"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Clock, DoorOpen, KeyRound, LogOut, PlusCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useErrorText, useI18n } from "@/lib/i18n";
import type { MessListItem } from "@/lib/types";
import { RequireAuth } from "@/components/RequireAuth";
import { Logo } from "@/components/Logo";
import { LangToggle, ThemeToggle } from "@/components/Toggles";
import { Badge, Button, Field, Input, Panel, Segmented, useFeedback, cx } from "@/components/ui";

function Onboarding() {
  const { t } = useI18n();
  const errText = useErrorText();
  const { signOut } = useAuth();
  const { toast } = useFeedback();
  const router = useRouter();
  const params = useSearchParams();
  const list = useSWR<{ messes: MessListItem[] }>("/api/messes");
  const [name, setName] = useState("");
  const [meals, setMeals] = useState<2 | 3>(2);
  const [code, setCode] = useState(params.get("code") ?? "");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [err, setErr] = useState<{ create?: string; join?: string }>({});

  function openMess(id: string) {
    try {
      localStorage.setItem("ms_mess", id);
    } catch {
      /* ignore */
    }
    router.push("/dashboard");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setErr({});
    try {
      const r = await api<{ mess: { id: string } }>("/api/messes", { method: "POST", body: { name, mealsPerDay: meals } });
      await list.mutate();
      openMess(r.mess.id);
    } catch (e2) {
      setErr({ create: errText(e2) });
    } finally {
      setBusy(null);
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy("join");
    setErr({});
    try {
      const r = await api<{ mess: { name: string } }>("/api/messes/join", { method: "POST", body: { code: code.trim() } });
      toast(t.onboarding.requested(r.mess.name));
      setCode("");
      await list.mutate();
    } catch (e2) {
      setErr({ join: errText(e2) });
    } finally {
      setBusy(null);
    }
  }

  const messes = list.data?.messes ?? [];
  const focusJoin = params.get("join") === "1";

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/">
          <Logo label={t.appName} />
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <button onClick={signOut} className="grid size-9 place-items-center rounded-full border border-line bg-surface text-ink-2 hover:text-ink" aria-label={t.common.signOut}>
            <LogOut className="size-4" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{t.onboarding.title}</h1>
        <p className="mt-2 max-w-xl text-ink-2">{t.onboarding.body}</p>

        {messes.length ? (
          <Panel className="mt-8 p-2">
            <h2 className="px-3 pb-1 pt-2 text-sm font-semibold text-ink-3">{t.onboarding.myRequests}</h2>
            <ul>
              {messes.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-surface-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{m.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-ink-3">
                      {m.status === "PENDING" ? (
                        <>
                          <Clock className="size-3.5" /> {t.onboarding.waiting}
                        </>
                      ) : m.status === "REJECTED" ? (
                        <>
                          <XCircle className="size-3.5" /> {t.onboarding.rejectedNote}
                        </>
                      ) : (
                        <Badge tone={m.role === "ADMIN" ? "turmeric" : "leaf"}>{m.role === "ADMIN" ? t.common.admin : t.common.memberRole}</Badge>
                      )}
                    </p>
                  </div>
                  {m.status === "APPROVED" ? (
                    <Button size="sm" onClick={() => openMess(m.id)} icon={<DoorOpen className="size-4" />}>
                      {t.onboarding.open}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <div className={cx("mt-8 grid gap-5 md:grid-cols-2", focusJoin && "md:[&>*:first-child]:order-2")}>
          <Panel className="p-5 sm:p-6">
            <PlusCircle className="size-7 text-leaf" />
            <h2 className="mt-3 font-display text-2xl font-bold">{t.onboarding.createTitle}</h2>
            <p className="mt-1 text-ink-2">{t.onboarding.createBody}</p>
            <form onSubmit={create} className="mt-5 flex flex-col gap-4">
              <Field label={t.onboarding.messName} htmlFor="messName">
                <Input id="messName" required minLength={2} maxLength={60} placeholder={t.onboarding.messNamePh} value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label={t.onboarding.mealsPerDay}>
                <Segmented
                  value={meals}
                  onChange={setMeals}
                  className="w-full [&>button]:flex-1"
                  options={[
                    { value: 2, label: t.onboarding.twoMeals },
                    { value: 3, label: t.onboarding.threeMeals },
                  ]}
                />
              </Field>
              {err.create ? <p className="text-[15px] text-due" role="alert">{err.create}</p> : null}
              <Button type="submit" loading={busy === "create"} disabled={name.trim().length < 2}>
                {t.onboarding.create}
              </Button>
            </form>
          </Panel>
          <Panel className="p-5 sm:p-6">
            <KeyRound className="size-7 text-turmeric" />
            <h2 className="mt-3 font-display text-2xl font-bold">{t.onboarding.joinTitle}</h2>
            <p className="mt-1 text-ink-2">{t.onboarding.joinBody}</p>
            <form onSubmit={join} className="mt-5 flex flex-col gap-4">
              <Field label={t.onboarding.code} htmlFor="code">
                <Input
                  id="code"
                  required
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="AB3K7Q2M"
                  className="font-display text-lg tracking-[0.2em] uppercase"
                  value={code}
                  autoFocus={focusJoin}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </Field>
              {err.join ? <p className="text-[15px] text-due" role="alert">{err.join}</p> : null}
              <Button type="submit" variant="accent" loading={busy === "join"} disabled={code.trim().length < 4}>
                {t.onboarding.join}
              </Button>
            </form>
          </Panel>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <Suspense>
        <Onboarding />
      </Suspense>
    </RequireAuth>
  );
}
