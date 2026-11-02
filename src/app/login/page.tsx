"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useErrorText, useI18n } from "@/lib/i18n";
import { safeNext } from "@/lib/nav";
import type { User } from "@/lib/types";
import { AuthFrame, PasswordInput } from "@/components/AuthFrame";
import { Button, Field, Input } from "@/components/ui";

function LoginForm() {
  const { t } = useI18n();
  const errText = useErrorText();
  const { signIn, user, ready } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, router, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ token: string; user: User }>("/api/auth/login", { method: "POST", body: { email, password } });
      signIn(r.token, r.user);
      router.replace(next);
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      title={t.auth.loginTitle}
      body={t.auth.loginBody}
      footer={
        <>
          {t.auth.noAccount}{" "}
          <Link className="font-semibold text-leaf underline-offset-4 hover:underline" href={`/register${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`}>
            {t.auth.register}
          </Link>
          <p className="mt-4 text-sm text-ink-3">{t.auth.forgot}</p>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label={t.auth.email} htmlFor="email">
          <Input id="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={t.auth.password} htmlFor="password">
          <PasswordInput id="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error ? (
          <p className="rounded-xl bg-due-soft px-3 py-2 text-[15px] text-due" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={busy} className="mt-2">
          {t.auth.login}
        </Button>
      </form>
    </AuthFrame>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
