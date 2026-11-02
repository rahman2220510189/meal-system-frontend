"use client";
import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useErrorText, useI18n } from "@/lib/i18n";
import { AuthFrame } from "@/components/AuthFrame";
import { Button, ErrorBox, Loading, Panel, useFeedback } from "@/components/ui";

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = use(params);
  const code = decodeURIComponent(raw).toUpperCase();
  const { t, fmt } = useI18n();
  const errText = useErrorText();
  const { user, ready } = useAuth();
  const { toast } = useFeedback();
  const router = useRouter();
  const preview = useSWR<{ name: string; members: number }>(ready && user ? `/api/messes/preview/${encodeURIComponent(code)}` : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function join() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ mess: { name: string } }>("/api/messes/join", { method: "POST", body: { code } });
      toast(t.onboarding.requested(r.mess.name));
      router.replace("/onboarding");
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  const next = encodeURIComponent(`/join/${code}`);
  return (
    <AuthFrame title={t.onboarding.joinPageTitle} body={t.onboarding.joinBody} footer={null}>
      {!ready ? (
        <Loading />
      ) : !user ? (
        <Panel className="p-5">
          <p className="text-ink-2">{t.onboarding.joinNeedAccount}</p>
          <div className="mt-4 flex gap-2">
            <Link href={`/register?next=${next}`} className="inline-flex h-11 items-center rounded-xl bg-leaf px-4 font-semibold text-white dark:text-[#06140f]">
              {t.auth.register}
            </Link>
            <Link href={`/login?next=${next}`} className="inline-flex h-11 items-center rounded-xl border border-line px-4 font-semibold">
              {t.auth.login}
            </Link>
          </div>
        </Panel>
      ) : preview.error ? (
        <ErrorBox error={preview.error} />
      ) : !preview.data ? (
        <Loading />
      ) : (
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-leaf-soft text-leaf">
              <Users className="size-6" />
            </span>
            <p className="font-display text-xl font-bold">{t.onboarding.joinPreview(preview.data.name, fmt.int(preview.data.members))}</p>
          </div>
          {error ? <p className="mt-4 text-due" role="alert">{error}</p> : null}
          <Button className="mt-5 w-full" variant="accent" loading={busy} onClick={join}>
            {t.onboarding.join}
          </Button>
        </Panel>
      )}
    </AuthFrame>
  );
}
