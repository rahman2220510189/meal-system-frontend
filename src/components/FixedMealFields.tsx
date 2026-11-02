"use client";
import { useI18n } from "@/lib/i18n";
import { Field, Input, cx } from "./ui";

export function FixedMealFields({ fixed, setFixed, min, setMin }: { fixed: boolean; setFixed: (b: boolean) => void; min: string; setMin: (s: string) => void }) {
  const { t } = useI18n();
  const R = t.reports;
  return (
    <div className="rounded-2xl border border-line p-4">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span>
          <span className="block font-semibold">{R.fixedMeal}</span>
          <span className="text-sm text-ink-3">{R.fixedMealHint}</span>
        </span>
        <input type="checkbox" checked={fixed} onChange={(e) => setFixed(e.target.checked)} className="peer sr-only" />
        <span className={cx("relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-turmeric", fixed ? "bg-leaf" : "bg-line")} aria-hidden>
          <span className={cx("absolute top-1 size-5 rounded-full bg-white shadow transition-all", fixed ? "left-6" : "left-1")} />
        </span>
      </label>
      {fixed ? (
        <Field label={R.minMeals} htmlFor="fixed-min" className="mt-3">
          <Input id="fixed-min" type="number" inputMode="numeric" min={1} max={200} value={min} onChange={(e) => setMin(e.target.value)} className="w-32" />
        </Field>
      ) : null}
    </div>
  );
}
