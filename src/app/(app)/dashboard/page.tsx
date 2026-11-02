"use client";
import Link from "next/link";
import { ArrowUpRight, CookingPot, ShoppingBasket, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useMess } from "@/lib/mess";
import { useSummary } from "@/lib/hooks";
import { Badge, Button, ErrorBox, Loading, Money, Panel, cx } from "@/components/ui";

export default function DashboardPage() {
  const { t, fmt } = useI18n();
  const { user } = useAuth();
  const { detail, month, isAdmin, months } = useMess();
  const { data: s, error, mutate } = useSummary();
  const D = t.dashboard;

  if (!months.length) return null;
  if (error) return <ErrorBox error={error} onRetry={() => mutate()} />;
  if (!s || !month) return <Loading />;

  const me = s.members.find((m) => m.membershipId === detail?.me.membershipId);
  const closed = s.month.status === "CLOSED";
  const bal = me?.balance ?? 0;
  const balTone = Math.abs(bal) < 0.005 ? "settled" : bal < 0 ? "due" : "plus";
  const pend = s.totals.pendingBazarCount + s.totals.pendingDepositCount + (detail?.pendingMembers ?? 0);
  const mealsPerDay = s.month.mealsPerDay;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-ink-2">{D.hello(user?.name.split(" ")[0] ?? "")}</p>
        <h1 className="flex flex-wrap items-center gap-3 font-display text-[30px] font-bold leading-tight sm:text-4xl">
          {fmt.monthName(s.month.year, s.month.month)}
          <Badge tone={closed ? "neutral" : "plus"}>{t.status[s.month.status]}</Badge>
        </h1>
      </header>

      {closed ? (
        <p className="flex items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-ink-2">
          <Lock className="size-4" /> {D.closedNotice}
        </p>
      ) : null}

      {/* Admin approvals first: they block everyone's numbers */}
      {isAdmin && pend > 0 && !closed ? (
        <Panel className="flex flex-col gap-3 border-turmeric/50 bg-turmeric-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-turmeric-ink">{D.pendingTitle}</p>
            <p className="text-[15px] text-turmeric-ink/80">
              {[
                s.totals.pendingBazarCount ? D.pendingBazar(fmt.int(s.totals.pendingBazarCount)) : null,
                s.totals.pendingDepositCount ? D.pendingDeposit(fmt.int(s.totals.pendingDepositCount)) : null,
                detail?.pendingMembers ? D.pendingMembers(fmt.int(detail.pendingMembers)) : null,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {s.totals.pendingBazarCount ? (
              <Link href="/bazar?filter=PENDING" className="inline-flex h-9 items-center rounded-xl bg-surface px-3 text-sm font-semibold">
                {t.nav.bazar}
              </Link>
            ) : null}
            {s.totals.pendingDepositCount ? (
              <Link href="/deposits?filter=PENDING" className="inline-flex h-9 items-center rounded-xl bg-surface px-3 text-sm font-semibold">
                {t.nav.deposits}
              </Link>
            ) : null}
            {detail?.pendingMembers ? (
              <Link href="/members" className="inline-flex h-9 items-center rounded-xl bg-surface px-3 text-sm font-semibold">
                {t.nav.members}
              </Link>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {/* My balance — the number every member opens the app for */}
        {me ? (
          <Panel className="overflow-hidden">
            <div className={cx("p-5 sm:p-6", balTone === "due" ? "bg-due-soft" : balTone === "plus" ? "bg-plus-soft" : "bg-surface-2")}>
              <p className={cx("font-semibold", balTone === "due" ? "text-due" : balTone === "plus" ? "text-plus" : "text-ink-2")}>
                {D.yourBalance} · {balTone === "due" ? D.due : balTone === "plus" ? D.plus : D.settled}
              </p>
              <p className={cx("mt-1 font-display text-5xl font-extrabold tabular sm:text-6xl", balTone === "due" ? "text-due" : balTone === "plus" ? "text-plus" : "text-ink")}>
                {fmt.money(bal, { sign: true })}
              </p>
              <p className="mt-1 text-[15px] text-ink-2">
                {balTone === "due" ? D.dueHint(fmt.money(-bal)) : balTone === "plus" ? D.plusHint(fmt.money(bal)) : null}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
              {[
                [D.myMeals, fmt.num(me.ownMeals)],
                [D.myGuests, fmt.num(me.guestMeals)],
                [D.mealRate, fmt.money(s.mealRate)],
                [D.myCost, fmt.money(me.totalCost)],
                [D.myDeposit, fmt.money(me.deposit)],
                [D.carryIn, fmt.money(me.carryIn, { sign: true })],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface px-5 py-3.5">
                  <dt className="text-[13px] text-ink-3">{k}</dt>
                  <dd className="font-display text-xl font-bold tabular">{v}</dd>
                </div>
              ))}
            </dl>
            {s.month.fixedMealEnabled && me.minMeals > 0 ? (
              <p className={cx("border-t border-line px-5 py-3 text-[15px]", me.shortfall > 0 ? "text-turmeric-ink" : "text-ink-2")}>
                {me.shortfall > 0 ? D.minimumShort(fmt.num(me.shortfall), fmt.num(me.minMeals)) : D.minimumOk(fmt.num(me.minMeals))}
              </p>
            ) : null}
            {me.sharedCost > 0 ? (
              <p className="border-t border-line px-5 py-3 text-[15px] text-ink-2">
                {D.sharedCost}: <Money value={me.sharedCost} />
              </p>
            ) : null}
          </Panel>
        ) : null}

        {/* Kitchen count */}
        <Panel className="flex flex-col p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <CookingPot className="size-5 text-turmeric" /> {D.kitchenTitle}
          </h2>
          {s.today ? (
            <>
              <p className="text-sm text-ink-3">{fmt.date(s.today.date, "long")}</p>
              <ul className="mt-4 flex flex-col divide-y divide-line">
                {(mealsPerDay === 3 ? (["breakfast", "lunch", "dinner"] as const) : (["lunch", "dinner"] as const)).map((m) => {
                  const g = s.today![m === "breakfast" ? "guestBreakfast" : m === "lunch" ? "guestLunch" : "guestDinner"];
                  return (
                    <li key={m} className="flex items-baseline justify-between py-3">
                      <span className="font-semibold">{t.meal[m]}</span>
                      <span className="text-right">
                        <span className="font-display text-3xl font-bold tabular">{fmt.int(s.today![m] + g)}</span>{" "}
                        <span className="text-ink-3">{D.people}</span>
                        {g ? <span className="block text-sm text-turmeric-ink">{D.plusGuests(fmt.int(g))}</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-auto rounded-xl bg-surface-2 px-4 py-3">
                <p className="flex items-center gap-2 text-sm text-ink-3">
                  <ShoppingBasket className="size-4" /> {D.duty}
                </p>
                <p className="font-semibold">{s.today.duty.length ? s.today.duty.map((d) => d.name).join(", ") : <span className="font-normal text-ink-3">{D.noDuty}</span>}</p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-ink-3">{D.kitchenNotInMonth}</p>
          )}
        </Panel>
      </div>

      {/* Mess totals */}
      <section>
        <h2 className="mb-3 font-display text-xl font-bold">{D.messTitle}</h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className={cx("col-span-2 rounded-2xl bg-leaf p-4 text-white md:col-span-1 dark:text-[#06140f]", !s.totals.sharedCost && "xl:col-span-2")}>
            <dt className="text-sm opacity-85">{closed ? D.finalRate : D.mealRate}</dt>
            <dd className="font-display text-4xl font-extrabold tabular">{fmt.money(s.mealRate)}</dd>
            {!closed ? <p className="text-[13px] opacity-75">{D.liveRate}</p> : null}
          </div>
          {[
            [D.totalBazar, fmt.money(s.totals.bazar)],
            [D.totalMeals, fmt.num(s.totals.billedMeals)],
            [D.totalDeposit, fmt.money(s.totals.deposit)],
            [D.cashInHand, fmt.money(s.totals.cashInHand, { sign: true })],
            ...(s.totals.sharedCost ? [[D.otherCosts, fmt.money(s.totals.sharedCost)]] : []),
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-line bg-surface p-4">
              <dt className="text-sm text-ink-3">{k}</dt>
              <dd className="font-display text-2xl font-bold tabular">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Everyone */}
      <Panel>
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-display text-xl font-bold">{D.everyone}</h2>
          <Link href="/reports" className="inline-flex items-center gap-1 text-sm font-semibold text-leaf hover:underline">
            {t.nav.reports} <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="scroll-x mt-3">
          <table className="w-full min-w-[520px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-line text-[13px] text-ink-3">
                <th className="px-5 py-2 font-semibold">{t.common.member}</th>
                <th className="px-3 py-2 text-right font-semibold">{D.colMeals}</th>
                <th className="px-3 py-2 text-right font-semibold">{D.colCost}</th>
                <th className="px-3 py-2 text-right font-semibold">{D.colDeposit}</th>
                <th className="px-5 py-2 text-right font-semibold">{D.colBalance}</th>
              </tr>
            </thead>
            <tbody>
              {s.members.map((m) => (
                <tr key={m.membershipId} className={cx("border-b border-line last:border-0", m.membershipId === me?.membershipId && "bg-leaf-soft/50")}>
                  <td className="px-5 py-3 font-medium">
                    {m.name}
                    {m.membershipId === me?.membershipId ? <span className="ml-1.5 text-[13px] text-ink-3">({t.common.you})</span> : null}
                  </td>
                  <td className="px-3 py-3 text-right tabular">
                    {fmt.num(m.billedMeals)}
                    {m.guestMeals ? <span className="block text-[12px] text-ink-3">{t.meal.guest} {fmt.num(m.guestMeals)}</span> : null}
                  </td>
                  <td className="px-3 py-3 text-right tabular">{fmt.money(m.totalCost)}</td>
                  <td className="px-3 py-3 text-right tabular">{fmt.money(m.deposit)}</td>
                  <td className="px-5 py-3 text-right font-semibold">
                    <Money value={m.balance} sign />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {isAdmin && closed && !months.some((m) => m.status === "OPEN") ? (
        <Panel className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink-2">{D.noOpenMonth}</p>
          <Link href="/reports?new=1">
            <Button variant="accent">{D.startMonth}</Button>
          </Link>
        </Panel>
      ) : null}
    </div>
  );
}
