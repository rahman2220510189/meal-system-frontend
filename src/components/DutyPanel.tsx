"use client";
import { useState } from "react";
import useSWR from "swr";
import { Check, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useErrorText, useI18n, dhakaNow, addDays } from "@/lib/i18n";
import { useMess } from "@/lib/mess";
import { useSummary } from "@/lib/hooks";
import { Button, ErrorBox, Loading, Modal, Panel, cx, useFeedback } from "./ui";

type Duty = { date: string; membershipId: string; name: string };

export function DutyPanel() {
  const { t, fmt } = useI18n();
  const errText = useErrorText();
  const { toast } = useFeedback();
  const { messId, month, isAdmin } = useMess();
  const summary = useSummary();
  const key = messId && month ? `/api/messes/${messId}/months/${month.id}/duties` : null;
  const { data, error, mutate } = useSWR<{ duties: Duty[] }>(key);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const today = dhakaNow().today;
  const open = month?.status === "OPEN";

  if (error) return <ErrorBox error={error} onRetry={() => mutate()} />;
  if (!data || !month) return <Loading />;

  const days: string[] = [];
  for (let d = month.start; d <= month.end; d = addDays(d, 1)) days.push(d);
  const byDate = new Map<string, Duty[]>();
  for (const d of data.duties) byDate.set(d.date, [...(byDate.get(d.date) ?? []), d]);

  async function save() {
    if (!editDate) return;
    setBusy(true);
    try {
      await api(`/api/messes/${messId}/months/${month!.id}/duties`, { method: "PUT", body: { date: editDate, membershipIds: picked } });
      toast(t.entries.dutySaved);
      setEditDate(null);
      mutate();
      summary.mutate();
    } catch (e) {
      toast(errText(e), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="mb-4 text-ink-2">{t.entries.dutyBody}</p>
      <Panel>
        <ul className="divide-y divide-line">
          {days.map((d) => {
            const list = byDate.get(d) ?? [];
            const isToday = d === today;
            return (
              <li key={d} className={cx("flex items-center gap-3 px-4 py-2.5 sm:px-5", isToday && "bg-turmeric-soft/60 shadow-[inset_4px_0_0_var(--turmeric)]", d < today && "opacity-70")}>
                <span className="w-24 shrink-0 font-semibold tabular">{fmt.date(d, "day")}</span>
                <span className="flex-1 text-[15px]">{list.length ? list.map((x) => x.name).join(", ") : <span className="text-ink-3">{t.entries.dutyNone}</span>}</span>
                {isAdmin && open ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<UserPlus className="size-4" />}
                    onClick={() => {
                      setPicked(list.map((x) => x.membershipId));
                      setEditDate(d);
                    }}
                    aria-label={`${t.entries.dutyAssign} ${fmt.date(d)}`}
                  >
                    <span className="hidden sm:inline">{t.entries.dutyAssign}</span>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Panel>
      <Modal
        open={!!editDate}
        onClose={() => setEditDate(null)}
        title={editDate ? `${t.entries.dutyTab} — ${fmt.date(editDate, "long")}` : ""}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditDate(null)}>
              {t.common.cancel}
            </Button>
            <Button loading={busy} onClick={save}>
              {t.common.save}
            </Button>
          </>
        }
      >
        <ul className="flex flex-col gap-2">
          {(summary.data?.members ?? [])
            .filter((m) => m.status === "APPROVED")
            .map((m) => {
              const on = picked.includes(m.membershipId);
              return (
                <li key={m.membershipId}>
                  <label className={cx("flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 font-semibold", on ? "border-leaf bg-leaf-soft text-leaf" : "border-line")}>
                    {m.name}
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={(e) => setPicked((p) => (e.target.checked ? [...p, m.membershipId] : p.filter((x) => x !== m.membershipId)))}
                    />
                    <span className={cx("grid size-6 place-items-center rounded-full border", on ? "border-leaf bg-leaf text-white dark:text-[#06140f]" : "border-line")}>{on ? <Check className="size-4" /> : null}</span>
                  </label>
                </li>
              );
            })}
        </ul>
      </Modal>
    </>
  );
}
