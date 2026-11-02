"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useErrorText, useI18n } from "@/lib/i18n";
import { useMess } from "@/lib/mess";
import { useSummary } from "@/lib/hooks";
import { Button, Field, Input, PageHeader, Panel, Segmented, useFeedback } from "@/components/ui";
import { FixedMealFields } from "@/components/FixedMealFields";

export default function SettingsPage() {
  const { t, fmt } = useI18n();
  const errText = useErrorText();
  const { toast } = useFeedback();
  const router = useRouter();
  const { detail, isAdmin, month, messId, refreshDetail } = useMess();
  const summary = useSummary();
  const S = t.settings;

  const m = detail?.mess;
  const [name, setName] = useState(m?.name ?? "");
  const [bw, setBw] = useState<number>(m?.breakfastWeight ?? 0.5);
  const [cut, setCut] = useState({ b: m?.breakfastCutoff ?? "07:00", l: m?.lunchCutoff ?? "10:00", d: m?.dinnerCutoff ?? "17:00" });
  const [busyMess, setBusyMess] = useState(false);

  const [meals, setMeals] = useState<2 | 3>(month?.mealsPerDay === 3 ? 3 : 2);
  const [fixed, setFixed] = useState(month?.fixedMealEnabled ?? false);
  const [min, setMin] = useState(String(month?.fixedMealMin || 40));
  const [busyMonth, setBusyMonth] = useState(false);

  useEffect(() => {
    if (detail && !isAdmin) router.replace("/dashboard");
  }, [detail, isAdmin, router]);

  useEffect(() => {
    if (!month) return;
    setMeals(month.mealsPerDay === 3 ? 3 : 2);
    setFixed(month.fixedMealEnabled);
    setMin(String(month.fixedMealMin || 40));
  }, [month]);

  if (!isAdmin || !m) return null;

  async function saveMess(e: React.FormEvent) {
    e.preventDefault();
    setBusyMess(true);
    try {
      await api(`/api/messes/${messId}`, { method: "PATCH", body: { name, breakfastWeight: bw, breakfastCutoff: cut.b, lunchCutoff: cut.l, dinnerCutoff: cut.d } });
      await refreshDetail();
      toast(S.saved);
    } catch (err) {
      toast(errText(err), "error");
    } finally {
      setBusyMess(false);
    }
  }

  async function saveMonth(e: React.FormEvent) {
    e.preventDefault();
    if (!month) return;
    setBusyMonth(true);
    try {
      await api(`/api/messes/${messId}/months/${month.id}`, {
        method: "PATCH",
        body: { mealsPerDay: meals, fixedMealEnabled: fixed, fixedMealMin: fixed ? Number(min) || 0 : 0 },
      });
      await refreshDetail();
      summary.mutate();
      toast(S.saved);
    } catch (err) {
      toast(errText(err), "error");
    } finally {
      setBusyMonth(false);
    }
  }

  const monthOpen = month?.status === "OPEN";

  return (
    <div>
      <PageHeader title={S.title} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">{S.messTitle}</h2>
          <form onSubmit={saveMess} className="mt-4 flex flex-col gap-4">
            <Field label={t.onboarding.messName} htmlFor="s-name">
              <Input id="s-name" required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={S.breakfastWeight}>
              <Segmented
                value={bw}
                onChange={setBw}
                className="w-full [&>button]:flex-1"
                options={[
                  { value: 0.5, label: S.half },
                  { value: 1, label: S.full },
                ]}
              />
            </Field>
            <fieldset>
              <legend className="text-sm font-semibold">{S.cutoffs}</legend>
              <p className="text-sm text-ink-3">{S.cutoffsBody}</p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Field label={t.meal.breakfast} htmlFor="s-b">
                  <Input id="s-b" type="time" value={cut.b} onChange={(e) => setCut((c) => ({ ...c, b: e.target.value }))} required />
                </Field>
                <Field label={t.meal.lunch} htmlFor="s-l">
                  <Input id="s-l" type="time" value={cut.l} onChange={(e) => setCut((c) => ({ ...c, l: e.target.value }))} required />
                </Field>
                <Field label={t.meal.dinner} htmlFor="s-d">
                  <Input id="s-d" type="time" value={cut.d} onChange={(e) => setCut((c) => ({ ...c, d: e.target.value }))} required />
                </Field>
              </div>
            </fieldset>
            <Button type="submit" loading={busyMess} className="self-start">
              {t.common.save}
            </Button>
          </form>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">
            {S.monthTitle}
            {month ? <span className="ml-2 font-sans text-base font-normal text-ink-3">{fmt.monthName(month.year, month.month)}</span> : null}
          </h2>
          {!monthOpen ? (
            <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-ink-2">{S.monthClosed}</p>
          ) : (
            <form onSubmit={saveMonth} className="mt-4 flex flex-col gap-4">
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
              <FixedMealFields fixed={fixed} setFixed={setFixed} min={min} setMin={setMin} />
              <Button type="submit" loading={busyMonth} className="self-start">
                {t.common.save}
              </Button>
            </form>
          )}
        </Panel>
      </div>
    </div>
  );
}
