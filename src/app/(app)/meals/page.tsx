"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { CalendarRange, Check, ChevronDown, Lock, UserRound, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useErrorText, useI18n, dhakaNow, addDays } from "@/lib/i18n";
import { useMess } from "@/lib/mess";
import type { MealEntry, Month } from "@/lib/types";
import { Badge, Button, ErrorBox, Field, Input, Loading, Modal, PageHeader, Panel, Select, Stepper, cx, useFeedback } from "@/components/ui";

type MealKey = "breakfast" | "lunch" | "dinner";
type GuestKey = "guestBreakfast" | "guestLunch" | "guestDinner";
const GUEST: Record<MealKey, GuestKey> = { breakfast: "guestBreakfast", lunch: "guestLunch", dinner: "guestDinner" };

interface MealsResponse {
  month: Month;
  members: { membershipId: string; name: string; activeFrom: string; activeTo: string | null }[];
  member: { membershipId: string; name: string } | null;
  entries: MealEntry[];
  rules: { today: string; now: string; breakfastCutoff: string; lunchCutoff: string; dinnerCutoff: string; breakfastWeight: number };
}

export default function MealsPage() {
  const { t, fmt } = useI18n();
  const errText = useErrorText();
  const { toast } = useFeedback();
  const { messId, month, detail, isAdmin } = useMess();
  const { mutate: globalMutate } = useSWRConfig();
  const myId = detail?.me.membershipId ?? "";
  const [memberId, setMemberId] = useState<string>("");
  const target = memberId || myId;
  const key = messId && month ? `/api/messes/${messId}/months/${month.id}/meals?membershipId=${target}` : null;
  const { data, error, mutate } = useSWR<MealsResponse>(key);
  const [fresh, setFresh] = useState<string>("");
  const [guestDate, setGuestDate] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const todayRef = useRef<HTMLLIElement>(null);
  const scrolled = useRef(false);

  const isOwn = target === myId;
  const open = month?.status === "OPEN";
  const meals: MealKey[] = month?.mealsPerDay === 3 ? ["breakfast", "lunch", "dinner"] : ["lunch", "dinner"];
  const rules = data?.rules;

  // Keep "now" fresh so cutoffs lock in real time
  const [clock, setClock] = useState(dhakaNow());
  useEffect(() => {
    const id = setInterval(() => setClock(dhakaNow()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (data && todayRef.current && !scrolled.current) {
      scrolled.current = true;
      const el = todayRef.current;
      const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + el.offsetHeight / 2;
      if (y > 0) window.scrollTo({ top: y });
    }
  }, [data]);

  function canEdit(date: string, meal: MealKey) {
    if (!open) return false;
    if (isAdmin) return true;
    if (!isOwn || !rules) return false;
    if (date > clock.today) return true;
    if (date < clock.today) return false;
    const cutoff = meal === "breakfast" ? rules.breakfastCutoff : meal === "lunch" ? rules.lunchCutoff : rules.dinnerCutoff;
    return clock.now < cutoff;
  }

  const totals = useMemo(() => {
    if (!data) return { own: 0, guest: 0 };
    const bw = data.rules.breakfastWeight;
    let own = 0;
    let guest = 0;
    const upTo = month?.status === "CLOSED" ? "9999-12-31" : clock.today;
    for (const e of data.entries) {
      if (e.date > upTo) continue;
      own += (month?.mealsPerDay === 3 && e.breakfast ? bw : 0) + (e.lunch ? 1 : 0) + (e.dinner ? 1 : 0);
      guest += (month?.mealsPerDay === 3 ? e.guestBreakfast * bw : 0) + e.guestLunch + e.guestDinner;
    }
    return { own, guest };
  }, [data, month?.mealsPerDay, month?.status, clock.today]);

  function refreshSummary() {
    if (messId && month) globalMutate(`/api/messes/${messId}/months/${month.id}`);
  }

  async function save(date: string, patch: Partial<MealEntry>) {
    if (!data || !key) return;
    const prev = data;
    const next = { ...data, entries: data.entries.map((e) => (e.date === date ? { ...e, ...patch } : e)) };
    mutate(next, { revalidate: false });
    try {
      await api(`/api/messes/${messId}/months/${month!.id}/meals`, {
        method: "PUT",
        body: { membershipId: target, date, ...patch },
      });
      refreshSummary();
    } catch (e) {
      mutate(prev, { revalidate: false });
      toast(errText(e), "error");
    }
  }

  function toggle(e: MealEntry, meal: MealKey) {
    if (!canEdit(e.date, meal)) return;
    const val = !e[meal];
    if (val) setFresh(`${e.date}-${meal}`);
    save(e.date, { [meal]: val });
  }

  if (error) return <ErrorBox error={error} onRetry={() => mutate()} />;

  const members = data?.members ?? [];
  const guestEntry = data?.entries.find((e) => e.date === guestDate) ?? null;
  const cutoffNote =
    rules && month?.mealsPerDay === 3
      ? t.meals.cutoffNote(fmt.time(rules.breakfastCutoff), fmt.time(rules.lunchCutoff), fmt.time(rules.dinnerCutoff))
      : rules
        ? t.meals.cutoffNote2(fmt.time(rules.lunchCutoff), fmt.time(rules.dinnerCutoff))
        : "";

  return (
    <div>
      <PageHeader
        title={t.meals.title}
        body={open && (isOwn || isAdmin) ? cutoffNote : undefined}
        actions={
          open && (isOwn || isAdmin) ? (
            <Button variant="soft" icon={<CalendarRange className="size-4" />} onClick={() => setBulkOpen(true)}>
              {t.meals.bulkTitle}
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid max-w-3xl gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label={t.meals.viewing} htmlFor="member">
          <Select id="member" value={target} onChange={(e) => setMemberId(e.target.value)}>
            {members.map((m) => (
              <option key={m.membershipId} value={m.membershipId}>
                {m.name}
                {m.membershipId === myId ? ` (${t.common.you})` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex gap-2">
          <div className="flex-1 rounded-2xl border border-line bg-surface px-4 py-2 sm:flex-none">
            <p className="flex items-center gap-1.5 text-[13px] text-ink-3">
              <UserRound className="size-3.5" /> {t.meals.own}
            </p>
            <p className="font-display text-2xl font-bold tabular">{fmt.num(totals.own)}</p>
          </div>
          <div className="flex-1 rounded-2xl border border-line bg-surface px-4 py-2 sm:flex-none">
            <p className="flex items-center gap-1.5 text-[13px] text-ink-3">
              <Users className="size-3.5" /> {t.meals.guestShort}
            </p>
            <p className="font-display text-2xl font-bold tabular">{fmt.num(totals.guest)}</p>
          </div>
        </div>
      </div>

      {!isOwn && !isAdmin ? <p className="mb-3 rounded-xl bg-surface-2 px-4 py-2.5 text-[15px] text-ink-2">{t.meals.readOnly}</p> : null}
      {month?.mealsPerDay === 3 && rules ? <p className="mb-3 text-sm text-ink-3">{t.meals.breakfastWeight(fmt.num(rules.breakfastWeight))}</p> : null}

      {!data ? (
        <Loading />
      ) : !data.entries.length ? (
        <Panel className="p-8 text-center text-ink-2">{t.meals.notActive}</Panel>
      ) : (
        <Panel className="max-w-3xl">
          <div
            className="sticky top-[var(--topbar,57px)] z-10 grid items-center gap-x-2 rounded-t-2xl border-b border-line bg-surface-2 px-3 py-2 text-[13px] font-semibold text-ink-3 sm:px-5"
            style={{ gridTemplateColumns: `minmax(0,1fr) repeat(${meals.length}, 2.75rem) 3.75rem` }}
          >
            <span>{t.common.date}</span>
            {meals.map((m) => (
              <span key={m} className="text-center">
                {t.meal[m]}
              </span>
            ))}
            <span className="text-center">{t.meal.guest}</span>
          </div>
          <ul>
            {data.entries.map((e) => {
              const isToday = e.date === clock.today;
              const guests = meals.reduce((s, m) => s + e[GUEST[m]], 0);
              const anyEditable = meals.some((m) => canEdit(e.date, m));
              const weekday = new Date(e.date + "T00:00:00Z").getUTCDay();
              return (
                <li
                  key={e.date}
                  ref={isToday ? todayRef : undefined}
                  className={cx(
                    "grid items-center gap-x-2 border-b border-line px-3 py-1.5 last:rounded-b-2xl last:border-0 sm:px-5",
                    isToday && "bg-turmeric-soft/60 shadow-[inset_4px_0_0_var(--turmeric)]",
                    weekday === 5 && !isToday && "bg-surface-2/50",
                  )}
                  style={{ gridTemplateColumns: `minmax(0,1fr) repeat(${meals.length}, 2.75rem) 3.75rem` }}
                >
                  <div className="min-w-0">
                    <p className={cx("truncate font-semibold tabular", isToday ? "text-turmeric-ink" : "text-ink")}>{fmt.date(e.date, "day")}</p>
                    {isToday ? (
                      <p className="text-[12px] font-semibold text-turmeric-ink">{t.common.today}</p>
                    ) : !anyEditable && open && e.date < clock.today ? (
                      <p className="flex items-center gap-1 text-[12px] text-ink-3">
                        <Lock className="size-3" /> {t.meals.locked}
                      </p>
                    ) : null}
                  </div>
                  {meals.map((m) => {
                    const editable = canEdit(e.date, m);
                    return (
                      <div key={m} className="grid place-items-center">
                        <button
                          type="button"
                          className="plate"
                          data-on={e[m]}
                          data-fresh={fresh === `${e.date}-${m}`}
                          disabled={!editable}
                          onClick={() => toggle(e, m)}
                          aria-pressed={e[m]}
                          aria-label={`${fmt.date(e.date)} ${t.meal[m]}: ${e[m] ? t.meals.on : t.meals.off}`}
                        >
                          {e[m] ? <Check className="size-4" strokeWidth={3} /> : null}
                        </button>
                      </div>
                    );
                  })}
                  <div className="grid place-items-center">
                    <button
                      type="button"
                      onClick={() => setGuestDate(e.date)}
                      className={cx(
                        "inline-flex h-9 min-w-12 items-center justify-center gap-1 rounded-full border px-2 text-sm font-semibold tabular",
                        guests ? "border-turmeric bg-turmeric-soft text-turmeric-ink" : "border-line text-ink-3 hover:text-ink",
                      )}
                      aria-label={`${fmt.date(e.date)} ${t.meal.guests}: ${fmt.int(guests)}`}
                    >
                      <Users className="size-3.5" />
                      {fmt.int(guests)}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <GuestSheet
        entry={guestEntry}
        meals={meals}
        canEdit={(m) => (guestEntry ? canEdit(guestEntry.date, m) : false)}
        onClose={() => setGuestDate(null)}
        onSave={async (patch) => {
          if (!guestEntry) return;
          await save(guestEntry.date, patch);
          setGuestDate(null);
        }}
      />

      {month && data ? (
        <BulkSheet
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
          month={month}
          meals={meals}
          today={clock.today}
          firstDate={data.entries[0]?.date ?? month.start}
          onApply={async (body) => {
            const r = await api<{ updated: number; skipped: number }>(`/api/messes/${messId}/months/${month.id}/meals/bulk`, {
              method: "POST",
              body: { membershipId: target, ...body },
            });
            await mutate();
            refreshSummary();
            const parts = [r.updated ? t.meals.applied(fmt.int(r.updated)) : t.meals.nothingChanged];
            if (r.skipped) parts.push(t.meals.skipped(fmt.int(r.skipped)));
            toast(parts.join(" · "), r.skipped ? "info" : "ok");
          }}
        />
      ) : null}
    </div>
  );
}

function GuestSheet({
  entry,
  meals,
  canEdit,
  onClose,
  onSave,
}: {
  entry: MealEntry | null;
  meals: MealKey[];
  canEdit: (m: MealKey) => boolean;
  onClose: () => void;
  onSave: (p: Partial<MealEntry>) => Promise<void>;
}) {
  const { t, fmt } = useI18n();
  const [vals, setVals] = useState<Record<GuestKey, number>>({ guestBreakfast: 0, guestLunch: 0, guestDinner: 0 });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (entry) setVals({ guestBreakfast: entry.guestBreakfast, guestLunch: entry.guestLunch, guestDinner: entry.guestDinner });
  }, [entry]);
  const editable = meals.some(canEdit);
  return (
    <Modal
      open={!!entry}
      onClose={onClose}
      title={entry ? t.meals.guestSheetTitle(fmt.date(entry.date, "long")) : ""}
      description={t.meals.guestSheetBody}
      size="sm"
      footer={
        editable ? (
          <>
            <Button variant="outline" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                setBusy(true);
                const patch: Partial<MealEntry> = {};
                for (const m of meals) if (canEdit(m)) patch[GUEST[m]] = vals[GUEST[m]];
                await onSave(patch);
                setBusy(false);
              }}
            >
              {t.common.save}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>
            {t.common.close}
          </Button>
        )
      }
    >
      <ul className="flex flex-col divide-y divide-line">
        {meals.map((m) => (
          <li key={m} className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 font-semibold">
              {t.meal[m]}
              {!canEdit(m) ? <Lock className="size-3.5 text-ink-3" /> : null}
            </span>
            <Stepper label={`${t.meal.guest} ${t.meal[m]}`} value={vals[GUEST[m]]} onChange={(n) => setVals((v) => ({ ...v, [GUEST[m]]: n }))} disabled={!canEdit(m)} />
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function BulkSheet({
  open,
  onClose,
  month,
  meals,
  today,
  firstDate,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  month: Month;
  meals: MealKey[];
  today: string;
  firstDate: string;
  onApply: (b: { from: string; to: string } & Partial<Record<MealKey, boolean>>) => Promise<void>;
}) {
  const { t } = useI18n();
  const errText = useErrorText();
  const { toast } = useFeedback();
  const clampD = (d: string) => (d < firstDate ? firstDate : d > month.end ? month.end : d);
  const startDefault = clampD(addDays(today, 1));
  const [from, setFrom] = useState(startDefault);
  const [to, setTo] = useState(clampD(addDays(startDefault, 6)));
  const [which, setWhich] = useState<Record<MealKey, boolean>>({ breakfast: true, lunch: true, dinner: true });
  const [busy, setBusy] = useState<"on" | "off" | null>(null);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    if (open) {
      const s = clampD(addDays(today, 1));
      setFrom(s);
      setTo(clampD(addDays(s, 6)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function apply(on: boolean) {
    setBusy(on ? "on" : "off");
    try {
      const body: { from: string; to: string } & Partial<Record<MealKey, boolean>> = { from, to };
      for (const m of meals) if (which[m]) body[m] = on;
      await onApply(body);
      onClose();
    } catch (e) {
      toast(errText(e), "error");
    } finally {
      setBusy(null);
    }
  }

  const valid = from <= to && meals.some((m) => which[m]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.meals.bulkTitle}
      description={t.meals.bulkBody}
      footer={
        <>
          <Button variant="outline" loading={busy === "off"} disabled={!valid || !!busy} onClick={() => apply(false)}>
            {t.meals.turnOff}
          </Button>
          <Button loading={busy === "on"} disabled={!valid || !!busy} onClick={() => apply(true)}>
            {t.meals.turnOn}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="soft"
          onClick={() => {
            const s = clampD(addDays(today, 1));
            setFrom(s);
            setTo(clampD(addDays(s, 6)));
          }}
        >
          {t.meals.next7}
        </Button>
        <Button
          size="sm"
          variant="soft"
          onClick={() => {
            setFrom(clampD(addDays(today, 1)));
            setTo(month.end);
          }}
        >
          {t.meals.restOfMonth}
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label={t.common.from} htmlFor="bulk-from">
          <Input id="bulk-from" type="date" min={firstDate} max={month.end} value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label={t.common.to} htmlFor="bulk-to">
          <Input id="bulk-to" type="date" min={from} max={month.end} value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>
      <button type="button" onClick={() => setAdvanced((a) => !a)} className="mt-4 flex items-center gap-1 text-sm font-semibold text-ink-2" aria-expanded={advanced}>
        {t.meals.whichMeals}: {meals.filter((m) => which[m]).map((m) => t.meal[m]).join(", ")}
        <ChevronDown className={cx("size-4 transition-transform", advanced && "rotate-180")} />
      </button>
      {advanced ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {meals.map((m) => (
            <label key={m} className={cx("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 font-semibold", which[m] ? "border-leaf bg-leaf-soft text-leaf" : "border-line text-ink-2")}>
              <input type="checkbox" className="sr-only" checked={which[m]} onChange={(e) => setWhich((w) => ({ ...w, [m]: e.target.checked }))} />
              {which[m] ? <Check className="size-4" /> : null}
              {t.meal[m]}
            </label>
          ))}
        </div>
      ) : null}
      <p className="mt-4">
        <Badge tone="neutral">{month.mealsPerDay === 3 ? t.onboarding.threeMeals : t.onboarding.twoMeals}</Badge>
      </p>
    </Modal>
  );
}
