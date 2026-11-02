"use client";
import { useState } from "react";
import { api, tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useErrorText, useI18n } from "@/lib/i18n";
import type { User } from "@/lib/types";
import { Button, Field, Input, PageHeader, Panel, useFeedback } from "@/components/ui";
import { PasswordInput } from "@/components/AuthFrame";
import { LangToggle, ThemeToggle } from "@/components/Toggles";

export default function ProfilePage() {
  const { t } = useI18n();
  const errText = useErrorText();
  const { toast } = useFeedback();
  const { user, setUser, signOut } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState<"info" | "pass" | null>(null);
  const P = t.profile;

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setBusy("info");
    try {
      const r = await api<{ user: User }>("/api/auth/me", { method: "PATCH", body: { name, phone } });
      setUser(r.user);
      toast(P.saved);
    } catch (err) {
      toast(errText(err), "error");
    } finally {
      setBusy(null);
    }
  }

  async function savePass(e: React.FormEvent) {
    e.preventDefault();
    setBusy("pass");
    try {
      const r = await api<{ token: string; user: User }>("/api/auth/change-password", { method: "POST", body: { currentPassword: cur, newPassword: next } });
      tokenStore.set(r.token);
      setUser(r.user);
      setCur("");
      setNext("");
      toast(P.changed);
    } catch (err) {
      toast(errText(err), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title={P.title} body={user?.email} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">{P.info}</h2>
          <form onSubmit={saveInfo} className="mt-4 flex flex-col gap-4">
            <Field label={t.auth.name} htmlFor="p-name">
              <Input id="p-name" required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label={t.auth.phone} htmlFor="p-phone">
              <Input id="p-phone" type="tel" inputMode="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold">{t.common.language}</span>
              <LangToggle />
              <span className="ml-2 text-sm font-semibold">{t.common.theme}</span>
              <ThemeToggle />
            </div>
            <Button type="submit" loading={busy === "info"} className="self-start">
              {t.common.save}
            </Button>
          </form>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">{P.passwordTitle}</h2>
          <form onSubmit={savePass} className="mt-4 flex flex-col gap-4">
            <Field label={P.current} htmlFor="p-cur">
              <PasswordInput id="p-cur" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} required />
            </Field>
            <Field label={P.newPass} hint={t.auth.passwordHint} htmlFor="p-new">
              <PasswordInput id="p-new" autoComplete="new-password" minLength={6} value={next} onChange={(e) => setNext(e.target.value)} required />
            </Field>
            <Button type="submit" loading={busy === "pass"} disabled={!cur || next.length < 6} className="self-start">
              {t.common.save}
            </Button>
          </form>
        </Panel>
      </div>
      <Button variant="ghost" className="mt-6 text-due" onClick={signOut}>
        {t.common.signOut}
      </Button>
    </div>
  );
}
