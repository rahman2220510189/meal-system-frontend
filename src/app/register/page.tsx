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

function RegisterForm() {
  const { t, lang } = useI18n();
  const errText = useErrorText();
  const { signIn, user, ready } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), params.get("join") ? "/onboarding?join=1" : "/onboarding");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, router, next]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      setError(t.auth.passwordHint);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await api<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        body: { ...form, phone: form.phone || undefined, language: lang },
      });
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
      title={t.auth.registerTitle}
      body={t.auth.registerBody}
      footer={
        <>
          {t.auth.haveAccount}{" "}
          <Link className="font-semibold text-leaf underline-offset-4 hover:underline" href={`/login${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`}>
            {t.auth.login}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label={t.auth.name} htmlFor="name">
          <Input id="name" autoComplete="name" required minLength={2} value={form.name} onChange={set("name")} />
        </Field>
        <Field label={t.auth.email} htmlFor="email">
          <Input id="email" type="email" autoComplete="email" inputMode="email" required value={form.email} onChange={set("email")} />
        </Field>
        <Field label={<>{t.auth.phone} <span className="font-normal text-ink-3">({t.common.optional})</span></>} htmlFor="phone">
          <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label={t.auth.password} htmlFor="password" hint={t.auth.passwordHint}>
          <PasswordInput id="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={set("password")} />
        </Field>
        {error ? (
          <p className="rounded-xl bg-due-soft px-3 py-2 text-[15px] text-due" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={busy} className="mt-2">
          {t.auth.register}
        </Button>
      </form>
    </AuthFrame>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
