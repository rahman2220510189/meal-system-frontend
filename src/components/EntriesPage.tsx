"use client";
import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { Camera, Check, ExternalLink, HandCoins, ImageIcon, Pencil, Plus, ShoppingBasket, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useErrorText, useI18n, dhakaNow } from "@/lib/i18n";
import { useMess } from "@/lib/mess";
import type { Entry } from "@/lib/types";
import { Button, Empty, ErrorBox, Field, Input, Loading, Modal, Money, PageHeader, Panel, Segmented, Select, StatusBadge, Textarea, cx, useFeedback } from "./ui";
import { DutyPanel } from "./DutyPanel";
import { useSummary } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";

type Kind = "bazar" | "deposit";
type Filter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

function EntriesInner({ kind }: { kind: Kind }) {
  const { t, fmt } = useI18n();
  const errText = useErrorText();
  const { toast, confirm } = useFeedback();
  const { messId, month, detail, isAdmin } = useMess();
  const { mutate: globalMutate } = useSWRConfig();
  const params = useSearchParams();
  const initialFilter = (params.get("filter") as Filter) || "ALL";
  const [filter, setFilter] = useState<Filter>(["ALL", "PENDING", "APPROVED", "REJECTED"].includes(initialFilter) ? initialFilter : "ALL");
  const [tab, setTab] = useState<"list" | "duty">("list");
  const path = kind === "bazar" ? "bazar" : "deposits";
  const key = messId && month ? `/api/messes/${messId}/months/${month.id}/${path}` : null;
  const { data, error, mutate } = useSWR<{ entries: Entry[] }>(key);
  const [editing, setEditing] = useState<Entry | "new" | null>(null);
  const [rejecting, setRejecting] = useState<Entry | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const open = month?.status === "OPEN";
  const myId = detail?.me.membershipId;
  const { user } = useAuth();
  const E = t.entries;

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const shown = filter === "ALL" ? entries : entries.filter((e) => e.status === filter);
  const totalApproved = entries.filter((e) => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0);
  const totalPending = entries.filter((e) => e.status === "PENDING").reduce((s, e) => s + e.amount, 0);
  const countPending = entries.filter((e) => e.status === "PENDING").length;

  function refreshAll() {
    mutate();
    if (messId && month) {
      globalMutate(`/api/messes/${messId}/months/${month.id}`);
    }
  }

  async function act(e: Entry, action: "approve" | "delete") {
    if (action === "delete") {
      const ok = await confirm({ title: t.common.delete, body: E.deleteConfirm, danger: true, confirmText: t.common.delete });
      if (!ok) return;
    }
    setBusyId(e.id);
    try {
      if (action === "approve") await api(`/api/messes/${messId}/${path}/${e.id}/approve`, { method: "POST" });
      else await api(`/api/messes/${messId}/${path}/${e.id}`, { method: "DELETE" });
      toast(action === "approve" ? E.approvedToast : E.deletedToast);
      refreshAll();
    } catch (err) {
      toast(errText(err), "error");
    } finally {
      setBusyId(null);
    }
  }

  const canChange = (e: Entry) => open && (isAdmin || ((e.membershipId === myId || e.createdById === user?.id) && e.status !== "APPROVED"));

  return (
    <div>
      <PageHeader
        title={kind === "bazar" ? E.bazarTitle : E.depositTitle}
        body={kind === "bazar" ? E.bazarBody : E.depositBody}
        actions={
          open && tab === "list" ? (
            <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
              {kind === "bazar" ? E.addBazar : E.addDeposit}
            </Button>
          ) : null
        }
      />

      {kind === "bazar" ? (
        <Segmented
          className="mb-5"
          value={tab}
          onChange={setTab}
          options={[
            { value: "list", label: E.listTab },
            { value: "duty", label: E.dutyTab },
          ]}
        />
      ) : null}

      {tab === "duty" && kind === "bazar" ? (
        <DutyPanel />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-sm text-ink-3">{E.totalApproved}</p>
              <p className="font-display text-2xl font-bold tabular">{fmt.money(totalApproved)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-sm text-ink-3">
                {E.totalPending} {countPending ? `(${fmt.int(countPending)})` : ""}
              </p>
              <p className="font-display text-2xl font-bold tabular text-turmeric-ink">{fmt.money(totalPending)}</p>
            </div>
          </div>

          <div className="scroll-x -mx-4 mb-3 px-4">
            <Segmented
              size="sm"
              value={filter}
              onChange={setFilter}
              options={(["ALL", "PENDING", "APPROVED", "REJECTED"] as Filter[]).map((f) => ({
                value: f,
                label: f === "ALL" ? t.common.all : t.status[f],
              }))}
            />
          </div>

          {error ? (
            <ErrorBox error={error} onRetry={() => mutate()} />
          ) : !data ? (
            <Loading />
          ) : !shown.length ? (
            <Panel>
              <Empty
                icon={kind === "bazar" ? <ShoppingBasket className="size-6" /> : <HandCoins className="size-6" />}
                title={entries.length ? E.emptyFiltered : kind === "bazar" ? E.emptyBazar : E.emptyDeposit}
                action={
                  !entries.length && open ? (
                    <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
                      {kind === "bazar" ? E.addBazar : E.addDeposit}
                    </Button>
                  ) : null
                }
              />
            </Panel>
          ) : (
            <Panel>
              <ul className="divide-y divide-line">
                {shown.map((e) => (
                  <li key={e.id} className={cx("flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-5 sm:px-5", e.status === "PENDING" && "bg-turmeric-soft/35")}>
                    <div className="flex w-full items-start justify-between gap-3 sm:contents">
                      <div className="w-16 shrink-0 text-ink-2 sm:pt-0.5">
                        <p className="font-display text-2xl font-bold leading-none text-ink tabular">{fmt.int(Number(e.date.slice(8)))}</p>
                        <p className="text-[13px]">{t.months[Number(e.date.slice(5, 7)) - 1]}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{e.memberName}</p>
                          <StatusBadge status={e.status} />
                        </div>
                        {e.items || e.note ? <p className="mt-0.5 text-[15px] text-ink-2">{e.items || e.note}</p> : null}
                        {e.status === "REJECTED" && e.rejectReason ? (
                          <p className="mt-1 text-sm text-due">
                            {E.reason}: {e.rejectReason}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[13px] text-ink-3">
                          {E.addedBy(e.createdByName)} · {fmt.dateTime(e.createdAt)}
                        </p>
                        {e.receiptUrl ? (
                          <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-leaf hover:underline">
                            <ImageIcon className="size-4" /> {E.receiptView} <ExternalLink className="size-3" />
                          </a>
                        ) : null}
                      </div>
                      <p className="font-display text-xl font-bold sm:order-last sm:w-32 sm:text-right">
                        <Money value={e.amount} />
                      </p>
                    </div>
                    {open && (isAdmin || canChange(e)) ? (
                      <div className="flex flex-wrap gap-2 sm:w-auto sm:justify-end">
                        {isAdmin && e.status !== "APPROVED" ? (
                          <Button size="sm" icon={<Check className="size-4" />} loading={busyId === e.id} onClick={() => act(e, "approve")}>
                            {t.common.approve}
                          </Button>
                        ) : null}
                        {isAdmin && e.status === "PENDING" ? (
                          <Button size="sm" variant="outline" icon={<X className="size-4" />} onClick={() => setRejecting(e)}>
                            {t.common.reject}
                          </Button>
                        ) : null}
                        {canChange(e) ? (
                          <>
                            <Button size="sm" variant="ghost" icon={<Pencil className="size-4" />} onClick={() => setEditing(e)} aria-label={t.common.edit}>
                              <span className="sm:sr-only">{t.common.edit}</span>
                            </Button>
                            <Button size="sm" variant="ghost" className="text-due" icon={<Trash2 className="size-4" />} onClick={() => act(e, "delete")} aria-label={t.common.delete}>
                              <span className="sm:sr-only">{t.common.delete}</span>
                            </Button>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}

      {editing ? (
        <EntryForm
          kind={kind}
          entry={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(status) => {
            setEditing(null);
            toast(status === "APPROVED" ? E.savedApproved : E.savedPending);
            refreshAll();
          }}
        />
      ) : null}

      <RejectDialog
        entry={rejecting}
        onClose={() => setRejecting(null)}
        onDone={async (reason) => {
          if (!rejecting) return;
          try {
            await api(`/api/messes/${messId}/${path}/${rejecting.id}/reject`, { method: "POST", body: { reason } });
            toast(E.rejectedToast);
            setRejecting(null);
            refreshAll();
          } catch (err) {
            toast(errText(err), "error");
          }
        }}
      />
    </div>
  );
}

function RejectDialog({ entry, onClose, onDone }: { entry: Entry | null; onClose: () => void; onDone: (reason: string) => Promise<void> }) {
  const { t, fmt } = useI18n();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={!!entry}
      onClose={onClose}
      title={t.entries.rejectTitle}
      description={entry ? `${entry.memberName} · ${fmt.money(entry.amount)} · ${fmt.date(entry.date)}` : ""}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            loading={busy}
            disabled={reason.trim().length < 2}
            onClick={async () => {
              setBusy(true);
              await onDone(reason.trim());
              setBusy(false);
              setReason("");
            }}
          >
            {t.common.reject}
          </Button>
        </>
      }
    >
      <Field label={t.entries.reason} htmlFor="reject-reason">
        <Textarea id="reject-reason" maxLength={200} placeholder={t.entries.rejectPh} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Modal>
  );
}

function EntryForm({ kind, entry, onClose, onSaved }: { kind: Kind; entry: Entry | null; onClose: () => void; onSaved: (status: string) => void }) {
  const { t } = useI18n();
  const errText = useErrorText();
  const { messId, month, detail, isAdmin } = useMess();
  const config = useSWR<{ uploads: boolean }>("/api/config");
  const summary = useSummary();
  const today = dhakaNow().today;
  const defaultDate = month && today >= month.start && today <= month.end ? today : month?.start ?? today;
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [text, setText] = useState((kind === "bazar" ? entry?.items : entry?.note) ?? "");
  const [memberId, setMemberId] = useState(entry?.membershipId ?? detail?.me.membershipId ?? "");
  const [receiptId, setReceiptId] = useState<string | undefined>();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const path = kind === "bazar" ? "bazar" : "deposits";
  const E = t.entries;

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api<{ receiptId: string; url: string }>(`/api/messes/${messId}/uploads/receipt`, { method: "POST", form: fd });
      setReceiptId(r.receiptId);
      setPreview(URL.createObjectURL(file));
    } catch (e) {
      setError(errText(e));
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError(t.errors.VALIDATION);
      return;
    }
    setBusy(true);
    setError("");
    const body: Record<string, unknown> = { date, amount: Math.round(amt * 100) / 100 };
    if (kind === "bazar") body.items = text;
    else body.note = text;
    if (receiptId) body.receiptId = receiptId;
    if (isAdmin && memberId) body.membershipId = memberId;
    try {
      const r = entry
        ? await api<{ entry: Entry }>(`/api/messes/${messId}/${path}/${entry.id}`, { method: "PATCH", body })
        : await api<{ entry: Entry }>(`/api/messes/${messId}/months/${month!.id}/${path}`, { method: "POST", body });
      onSaved(r.entry.status);
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={entry ? E.editTitle : kind === "bazar" ? E.addBazar : E.addDeposit}>
      <form id="entry-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.common.date} htmlFor="e-date">
            <Input id="e-date" type="date" required min={month?.start} max={month?.end} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={`${t.common.amount} (৳)`} htmlFor="e-amount">
            <Input
              id="e-amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-display text-lg font-bold"
              data-autofocus
            />
          </Field>
        </div>
        {isAdmin ? (
          <Field label={kind === "bazar" ? E.whoShopped : E.whoPaid} htmlFor="e-member">
            <Select id="e-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {(summary.data?.members ?? []).map((m) => (
                <option key={m.membershipId} value={m.membershipId}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label={kind === "bazar" ? E.items : <>{t.common.note} <span className="font-normal text-ink-3">({t.common.optional})</span></>} htmlFor="e-text">
          <Textarea id="e-text" maxLength={kind === "bazar" ? 1000 : 300} placeholder={kind === "bazar" ? E.itemsPh : E.notePh} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        {kind === "bazar" && config.data?.uploads ? (
          <div>
            <p className="mb-1.5 text-sm font-semibold">
              {E.receipt} <span className="font-normal text-ink-3">({t.common.optional})</span>
            </p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            {preview ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt={E.receipt} className="size-20 rounded-xl object-cover" />
                <Button type="button" size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
                  {t.common.edit}
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" loading={uploading} icon={<Camera className="size-4" />} onClick={() => fileRef.current?.click()}>
                {uploading ? E.receiptUploading : E.receiptAdd}
              </Button>
            )}
          </div>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-due-soft px-3 py-2 text-due" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={busy} disabled={uploading}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function EntriesPage({ kind }: { kind: Kind }) {
  return (
    <Suspense>
      <EntriesInner kind={kind} />
    </Suspense>
  );
}
