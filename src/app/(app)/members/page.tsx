"use client";
import { useState } from "react";
import useSWR from "swr";
import { Check, Copy, KeyRound, MessageCircle, MoreVertical, RefreshCw, ShieldCheck, ShieldOff, UserMinus, X } from "lucide-react";
import { api } from "@/lib/api";
import { useErrorText, useI18n } from "@/lib/i18n";
import { useMess } from "@/lib/mess";
import { useSummary } from "@/lib/hooks";
import type { MemberListRow } from "@/lib/types";
import { Badge, Button, Empty, ErrorBox, Loading, Modal, Money, PageHeader, Panel, cx, useFeedback } from "@/components/ui";

export default function MembersPage() {
  const { t, fmt } = useI18n();
  const errText = useErrorText();
  const { toast, confirm } = useFeedback();
  const { messId, detail, isAdmin, refreshDetail } = useMess();
  const summary = useSummary();
  const { data, error, mutate } = useSWR<{ members: MemberListRow[] }>(messId ? `/api/messes/${messId}/members` : null);
  const [menu, setMenu] = useState<string | null>(null);
  const [temp, setTemp] = useState<{ name: string; pass: string } | null>(null);
  const [code, setCode] = useState<string | undefined>(undefined);
  const M = t.members;
  const joinCode = code ?? detail?.mess.code;
  const link = typeof window !== "undefined" && joinCode ? `${window.location.origin}/join/${joinCode}` : "";

  const pending = (data?.members ?? []).filter((m) => m.status === "PENDING");
  const active = (data?.members ?? []).filter((m) => m.status === "APPROVED");
  const balances = new Map((summary.data?.members ?? []).map((m) => [m.membershipId, m.balance]));

  async function run(fn: () => Promise<unknown>, okText: string) {
    try {
      await fn();
      toast(okText);
      await mutate();
      refreshDetail();
      summary.mutate();
    } catch (e) {
      toast(errText(e), "error");
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(t.common.copied);
    } catch {
      /* clipboard blocked */
    }
  }

  async function removeMember(m: MemberListRow) {
    setMenu(null);
    const bal = balances.get(m.membershipId) ?? 0;
    const body = bal < -0.005 ? M.removeDue(m.name, fmt.money(-bal)) : M.removeConfirm(m.name);
    if (!(await confirm({ title: M.remove, body, danger: true, confirmText: M.remove }))) return;
    run(() => api(`/api/messes/${messId}/members/${m.membershipId}/remove`, { method: "POST", body: { force: true } }), M.removedToast);
  }

  async function resetPassword(m: MemberListRow) {
    setMenu(null);
    if (!(await confirm({ title: M.resetPassword, body: m.name }))) return;
    try {
      const r = await api<{ tempPassword: string }>(`/api/messes/${messId}/members/${m.membershipId}/reset-password`, { method: "POST" });
      setTemp({ name: m.name, pass: r.tempPassword });
    } catch (e) {
      toast(errText(e), "error");
    }
  }

  return (
    <div>
      <PageHeader title={M.title} />

      {isAdmin && joinCode ? (
        <Panel className="mb-6 overflow-hidden">
          <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
            <div>
              <h2 className="font-display text-xl font-bold">{M.inviteTitle}</h2>
              <p className="mt-1 text-ink-2">{M.inviteBody}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" icon={<Copy className="size-4" />} onClick={() => copy(link)}>
                  {M.link}
                </Button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(M.shareText(detail?.mess.name ?? "", link))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1f9d55] px-3 text-sm font-semibold text-white"
                >
                  <MessageCircle className="size-4" /> {M.whatsapp}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw className="size-4" />}
                  onClick={async () => {
                    if (!(await confirm({ title: M.regenerate, body: M.regenerateConfirm }))) return;
                    try {
                      const r = await api<{ code: string }>(`/api/messes/${messId}/code`, { method: "POST" });
                      setCode(r.code);
                      refreshDetail();
                    } catch (e) {
                      toast(errText(e), "error");
                    }
                  }}
                >
                  {M.regenerate}
                </Button>
              </div>
            </div>
            <button onClick={() => copy(joinCode)} className="group rounded-2xl border-2 border-dashed border-turmeric bg-turmeric-soft px-6 py-4 text-center" aria-label={`${M.code}: ${joinCode}. ${t.common.copy}`}>
              <p className="text-sm text-turmeric-ink">{M.code}</p>
              <p className="font-display text-3xl font-extrabold tracking-[0.18em] text-turmeric-ink">{joinCode}</p>
              <p className="flex items-center justify-center gap-1 text-[13px] text-turmeric-ink/80">
                <Copy className="size-3.5" /> {t.common.copy}
              </p>
            </button>
          </div>
        </Panel>
      ) : null}

      {error ? (
        <ErrorBox error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-6">
          {isAdmin ? (
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
                {M.requests} {pending.length ? <Badge tone="turmeric">{fmt.int(pending.length)}</Badge> : null}
              </h2>
              <Panel>
                {pending.length ? (
                  <ul className="divide-y divide-line">
                    {pending.map((m) => (
                      <li key={m.membershipId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                          <p className="font-semibold">{m.name}</p>
                          <p className="text-sm text-ink-3">
                            {m.email} {m.phone ? `· ${m.phone}` : ""} · {M.requestedOn(fmt.dateTime(m.requestedAt))}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" icon={<Check className="size-4" />} onClick={() => run(() => api(`/api/messes/${messId}/members/${m.membershipId}/approve`, { method: "POST" }), M.approvedToast)}>
                            {t.common.approve}
                          </Button>
                          <Button size="sm" variant="outline" icon={<X className="size-4" />} onClick={() => run(() => api(`/api/messes/${messId}/members/${m.membershipId}/reject`, { method: "POST" }), M.rejectedToast)}>
                            {t.common.reject}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty title={M.noRequests} />
                )}
              </Panel>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 font-display text-xl font-bold">
              {M.active} <span className="text-ink-3">({fmt.int(active.length)})</span>
            </h2>
            <Panel>
              <ul className="divide-y divide-line">
                {active.map((m) => {
                  const bal = balances.get(m.membershipId);
                  const isMe = m.membershipId === detail?.me.membershipId;
                  return (
                    <li key={m.membershipId} className="relative flex items-center gap-3 px-4 py-3.5 sm:px-5">
                      <span className={cx("grid size-10 shrink-0 place-items-center rounded-full font-display text-lg font-bold", m.role === "ADMIN" ? "bg-turmeric-soft text-turmeric-ink" : "bg-leaf-soft text-leaf")}>
                        {m.name.trim().charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-semibold">
                          {m.name} {isMe ? <span className="text-[13px] font-normal text-ink-3">({t.common.you})</span> : null}
                          {m.role === "ADMIN" ? <Badge tone="turmeric">{t.common.admin}</Badge> : null}
                        </p>
                        <p className="truncate text-sm text-ink-3">
                          {m.phone ? (
                            <a href={`tel:${m.phone}`} className="hover:underline">
                              {m.phone}
                            </a>
                          ) : null}
                          {m.phone && m.approvedAt ? " · " : ""}
                          {m.approvedAt ? M.joined(fmt.date(m.approvedAt.slice(0, 10))) : null}
                        </p>
                      </div>
                      {bal !== undefined ? <Money value={bal} sign className="font-display text-lg font-bold" /> : null}
                      {isAdmin && !isMe ? (
                        <div className="relative">
                          <button onClick={() => setMenu(menu === m.membershipId ? null : m.membershipId)} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label={t.common.actions} aria-haspopup="menu" aria-expanded={menu === m.membershipId}>
                            <MoreVertical className="size-4" />
                          </button>
                          {menu === m.membershipId ? (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} aria-hidden />
                              <div role="menu" className="absolute right-0 z-40 mt-1 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
                                <MenuItem
                                  icon={m.role === "ADMIN" ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
                                  onClick={() => {
                                    setMenu(null);
                                    run(() => api(`/api/messes/${messId}/members/${m.membershipId}/role`, { method: "POST", body: { role: m.role === "ADMIN" ? "MEMBER" : "ADMIN" } }), M.roleToast);
                                  }}
                                >
                                  {m.role === "ADMIN" ? M.removeAdmin : M.makeAdmin}
                                </MenuItem>
                                <MenuItem icon={<KeyRound className="size-4" />} onClick={() => resetPassword(m)}>
                                  {M.resetPassword}
                                </MenuItem>
                                <MenuItem icon={<UserMinus className="size-4" />} danger onClick={() => removeMember(m)}>
                                  {M.remove}
                                </MenuItem>
                              </div>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </section>
        </div>
      )}

      <Modal
        open={!!temp}
        onClose={() => setTemp(null)}
        title={M.tempPassTitle}
        description={temp ? M.tempPassBody(temp.name) : ""}
        size="sm"
        footer={
          <Button onClick={() => temp && copy(temp.pass)} icon={<Copy className="size-4" />}>
            {t.common.copy}
          </Button>
        }
      >
        <p className="rounded-2xl bg-surface-2 px-4 py-4 text-center font-display text-2xl font-bold tracking-wide select-all">{temp?.pass}</p>
      </Modal>
    </div>
  );
}

function MenuItem({ icon, children, onClick, danger }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button role="menuitem" onClick={onClick} className={cx("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[15px] hover:bg-surface-2", danger && "text-due")}>
      {icon}
      {children}
    </button>
  );
}
