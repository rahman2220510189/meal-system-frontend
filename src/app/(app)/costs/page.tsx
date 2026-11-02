"use client";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Plus, ReceiptText, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useErrorText, useI18n, dhakaNow } from "@/lib/i18n";
import { useMess } from "@/lib/mess";
import { useSummary } from "@/lib/hooks";
import { Button, Empty, ErrorBox, Field, Input, Loading, Modal, Money, PageHeader, Panel, useFeedback } from "@/components/ui";

type Cost = { id: string; title: string; amount: number; date: string };

export default function CostsPage() {
  const { t, fmt } = useI18n();
  const errText = useErrorText();
  const { toast, confirm } = useFeedback();
  const { messId, month, isAdmin } = useMess();
  const { mutate: gm } = useSWRConfig();
  const summary = useSummary();
  const key = messId && month ? `/api/messes/${messId}/months/${month.id}/costs` : null;
  const { data, error, mutate } = useSWR<{ costs: Cost[] }>(key);
  const [adding, setAdding] = useState(false);
  const open = month?.status === "OPEN";
  const C = t.costs;

  const total = (data?.costs ?? []).reduce((s, c) => s + c.amount, 0);
  const heads = summary.data?.members.length || 1;

  async function remove(c: Cost) {
    if (!(await confirm({ title: t.common.delete, body: C.deleteConfirm, danger: true, confirmText: t.common.delete }))) return;
    try {
      await api(`/api/messes/${messId}/costs/${c.id}`, { method: "DELETE" });
      toast(t.entries.deletedToast);
      mutate();
      summary.mutate();
    } catch (e) {
      toast(errText(e), "error");
    }
  }

  return (
    <div>
      <PageHeader
        title={C.title}
        body={C.body}
        actions={
          isAdmin && open ? (
            <Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
              {C.add}
            </Button>
          ) : null
        }
      />
      {error ? (
        <ErrorBox error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <Loading />
      ) : !data.costs.length ? (
        <Panel>
          <Empty icon={<ReceiptText className="size-6" />} title={C.empty} />
        </Panel>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-line bg-surface p-4 sm:max-w-sm">
            <p className="text-sm text-ink-3">{t.reports.total}</p>
            <p className="font-display text-3xl font-bold tabular">{fmt.money(total)}</p>
            <p className="text-sm text-ink-3">{C.perHead(fmt.money(total / heads))}</p>
          </div>
          <Panel>
            <ul className="divide-y divide-line">
              {data.costs.map((c) => (
                <li key={c.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                  <span className="w-20 shrink-0 text-ink-2 tabular">{fmt.date(c.date)}</span>
                  <span className="flex-1 font-semibold">{c.title}</span>
                  <Money value={c.amount} className="font-display text-lg font-bold" />
                  {isAdmin && open ? (
                    <button onClick={() => remove(c)} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-due-soft hover:text-due" aria-label={`${t.common.delete} ${c.title}`}>
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
      {adding && month ? (
        <AddCost
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            toast(t.entries.savedApproved);
            mutate();
            summary.mutate();
            gm(`/api/messes/${messId}/months/${month.id}`);
          }}
        />
      ) : null}
    </div>
  );
}

function AddCost({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const errText = useErrorText();
  const { messId, month } = useMess();
  const today = dhakaNow().today;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(month && today >= month.start && today <= month.end ? today : month!.start);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/messes/${messId}/months/${month!.id}/costs`, { method: "POST", body: { title, amount: Number(amount), date } });
      onSaved();
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={t.costs.add} size="sm">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={t.costs.titleLabel} htmlFor="c-title">
          <Input id="c-title" required minLength={2} maxLength={80} placeholder={t.costs.titlePh} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`${t.common.amount} (৳)`} htmlFor="c-amount">
            <Input id="c-amount" type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label={t.common.date} htmlFor="c-date">
            <Input id="c-date" type="date" min={month?.start} max={month?.end} required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        {error ? <p className="text-due" role="alert">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={busy} disabled={title.trim().length < 2 || !Number(amount)}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
