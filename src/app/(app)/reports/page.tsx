"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarPlus, FileDown, ImageDown, Lock, LockOpen } from "lucide-react";
import { api } from "@/lib/api";
import { useErrorText, useI18n } from "@/lib/i18n";
import { useMess } from "@/lib/mess";
import { useSummary } from "@/lib/hooks";
import type { Summary } from "@/lib/types";
import { FixedMealFields } from "@/components/FixedMealFields";
import { useTheme } from "@/lib/theme";
import { Button, ErrorBox, Field, Input, Loading, Modal, Money, PageHeader, Panel, Segmented, Select, cx, useFeedback } from "@/components/ui";

async function capture(node: HTMLElement, format: "png" | "jpeg" = "png"): Promise<{ dataUrl: string; width: number; height: number }> {
  const { toPng, toJpeg } = await import("html-to-image");
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  if (wasDark) root.classList.remove("dark");
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  try {
    const opts = { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true };
    const dataUrl = format === "jpeg" ? await toJpeg(node, { ...opts, quality: 0.88 }) : await toPng(node, opts);
    return { dataUrl, width: node.offsetWidth, height: node.offsetHeight };
  } finally {
    if (wasDark) root.classList.add("dark");
  }
}

function ReportsInner() {
  const { t, fmt } = useI18n();
  const errText = useErrorText();
  const { toast, confirm } = useFeedback();
  const { messId, month, months, isAdmin, detail, refreshDetail, setMonthId } = useMess();
  const { data: s, error, mutate } = useSummary();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "png" | "close" | "reopen" | null>(null);
  const params = useSearchParams();
  const [newOpen, setNewOpen] = useState(false);
  const R = t.reports;

  const latest = months[0];
  const hasOpen = months.some((m) => m.status === "OPEN");

  useEffect(() => {
    if (params.get("new") === "1" && isAdmin && !hasOpen) setNewOpen(true);
  }, [params, isAdmin, hasOpen]);

  const fileBase = s && detail ? `${detail.mess.name}-${s.month.year}-${String(s.month.month).padStart(2, "0")}`.replace(/[\\/:*?"<>|]+/g, "-") : "report";

  async function downloadPng() {
    if (!sheetRef.current) return;
    setBusy("png");
    try {
      const { dataUrl } = await capture(sheetRef.current);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileBase}.png`;
      a.click();
    } catch (e) {
      toast(errText(e), "error");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    if (!sheetRef.current) return;
    setBusy("pdf");
    try {
      const { dataUrl, width, height } = await capture(sheetRef.current, "jpeg");
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const w = pw - margin * 2;
      const h = (height / width) * w;
      const usable = ph - margin * 2;
      if (h <= usable) {
        pdf.addImage(dataUrl, "JPEG", margin, margin, w, h);
      } else {
        // Long reports: slice the image across pages
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        const sliceH = Math.floor((usable / h) * img.height);
        for (let y = 0, page = 0; y < img.height; y += sliceH, page++) {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = Math.min(sliceH, img.height - y);
          c.getContext("2d")!.drawImage(img, 0, y, img.width, c.height, 0, 0, img.width, c.height);
          if (page) pdf.addPage();
          pdf.addImage(c.toDataURL("image/jpeg", 0.88), "JPEG", margin, margin, w, (c.height / img.width) * w);
        }
      }
      pdf.save(`${fileBase}.pdf`);
    } catch (e) {
      toast(errText(e), "error");
    } finally {
      setBusy(null);
    }
  }

  async function closeMonth() {
    if (!s || !month) return;
    const pending = s.totals.pendingBazarCount + s.totals.pendingDepositCount;
    const ok = await confirm({
      title: R.closeTitle,
      body: (
        <>
          <p>{R.closeBody}</p>
          {pending ? <p className="mt-3 rounded-xl bg-turmeric-soft px-3 py-2 text-turmeric-ink">{R.pendingWarn(fmt.int(s.totals.pendingBazarCount), fmt.int(s.totals.pendingDepositCount))}</p> : null}
        </>
      ),
      confirmText: pending ? R.closeAnyway : R.closeMonth,
    });
    if (!ok) return;
    setBusy("close");
    try {
      const r = await api<Summary>(`/api/messes/${messId}/months/${month.id}/close`, { method: "POST", body: { force: true } });
      mutate(r, { revalidate: false });
      await refreshDetail();
      toast(R.closedToast);
    } catch (e) {
      toast(errText(e), "error");
    } finally {
      setBusy(null);
    }
  }

  async function reopen() {
    if (!month || !(await confirm({ title: R.reopen, body: R.reopenConfirm }))) return;
    setBusy("reopen");
    try {
      await api(`/api/messes/${messId}/months/${month.id}/reopen`, { method: "POST" });
      await refreshDetail();
      await mutate();
      toast(R.reopenedToast);
    } catch (e) {
      toast(errText(e), "error");
    } finally {
      setBusy(null);
    }
  }

  if (error) return <ErrorBox error={error} onRetry={() => mutate()} />;

  const open = s?.month.status === "OPEN";

  return (
    <div>
      <PageHeader
        title={R.title}
        body={R.body}
        actions={
          <>
            <Button variant="outline" icon={<ImageDown className="size-4" />} loading={busy === "png"} disabled={!s || !!busy} onClick={downloadPng}>
              {busy === "png" ? R.preparing : R.downloadImage}
            </Button>
            <Button icon={<FileDown className="size-4" />} loading={busy === "pdf"} disabled={!s || !!busy} onClick={downloadPdf}>
              {busy === "pdf" ? R.preparing : R.downloadPdf}
            </Button>
          </>
        }
      />

      {isAdmin && s ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {open ? (
            <Button variant="accent" icon={<Lock className="size-4" />} loading={busy === "close"} onClick={closeMonth}>
              {R.closeMonth}
            </Button>
          ) : null}
          {!open && latest?.id === s.month.id && !hasOpen ? (
            <>
              <Button variant="accent" icon={<CalendarPlus className="size-4" />} onClick={() => setNewOpen(true)}>
                {R.newMonth}
              </Button>
              <Button variant="outline" icon={<LockOpen className="size-4" />} loading={busy === "reopen"} onClick={reopen}>
                {R.reopen}
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {!s ? <Loading /> : <ReportSheet ref={sheetRef} s={s} />}

      {newOpen && latest ? (
        <NewMonthModal
          onClose={() => setNewOpen(false)}
          onCreated={async (id) => {
            setNewOpen(false);
            await refreshDetail();
            setMonthId(id);
            toast(R.createdToast);
          }}
        />
      ) : null}
    </div>
  );
}

/** SVG chart fills need real colors, so read the theme tokens from CSS. */
function useTokenColors() {
  const { theme } = useTheme();
  const [c, setC] = useState({ leaf: "#0e5a47", turmeric: "#e3a414", due: "#b4233c", plus: "#0f7a52", line: "#d4ded7", ink2: "#4a5a54", ink3: "#7b8a84", surface: "#ffffff", surface2: "#e7eee8", ink: "#15211d" });
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const g = (v: string) => cs.getPropertyValue(v).trim();
    setC({ leaf: g("--leaf"), turmeric: g("--turmeric"), due: g("--due"), plus: g("--plus"), line: g("--line"), ink2: g("--ink-2"), ink3: g("--ink-3"), surface: g("--surface"), surface2: g("--surface-2"), ink: g("--ink") });
  }, [theme]);
  return c;
}

function ReportSheet({ s, ref }: { s: Summary; ref: React.Ref<HTMLDivElement> }) {
  const { t, fmt } = useI18n();
  const col = useTokenColors();
  const { detail } = useMess();
  const R = t.reports;
  const open = s.month.status === "OPEN";
  const [chart, setChart] = useState<"meals" | "balance" | "daily">("meals");
  const tickFmt = (v: number) => fmt.num(v, 0);
  const shortName = (n: string) => (n.length > 10 ? n.split(" ")[0] : n);

  const mealData = s.members.map((m) => ({ name: shortName(m.name), own: m.ownMeals, guest: m.guestMeals }));
  const balData = s.members.map((m) => ({ name: shortName(m.name), balance: m.balance }));
  const dailyData = s.daily.map((d) => ({ name: fmt.int(Number(d.date.slice(8))), own: d.own, guest: d.guest }));

  return (
    <div ref={ref} className="rounded-3xl border border-line bg-surface p-5 sm:p-8">
      <div className="flex flex-col gap-1 border-b-2 border-leaf pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-leaf">{t.appName}</p>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">{R.sheetTitle(detail?.mess.name ?? "", fmt.monthName(s.month.year, s.month.month))}</h2>
        </div>
        <p className="text-sm text-ink-3">{R.generated(fmt.dateTime(new Date()))}</p>
      </div>
      {open ? <p className="mt-3 rounded-xl bg-turmeric-soft px-3 py-2 text-[15px] text-turmeric-ink">{R.openNote}</p> : null}

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [open ? t.dashboard.mealRate : t.dashboard.finalRate, fmt.money(s.mealRate), true],
          [t.dashboard.totalBazar, fmt.money(s.totals.bazar), false],
          [t.dashboard.totalMeals, fmt.num(s.totals.billedMeals), false],
          [t.dashboard.totalDeposit, fmt.money(s.totals.deposit), false],
        ].map(([k, v, hl]) => (
          <div key={String(k)} className={cx("rounded-2xl p-3.5", hl ? "bg-leaf text-white dark:text-[#06140f]" : "bg-surface-2")}>
            <dt className={cx("text-[13px]", hl ? "opacity-85" : "text-ink-3")}>{k}</dt>
            <dd className="font-display text-2xl font-bold tabular">{v}</dd>
          </div>
        ))}
      </dl>
      {s.totals.sharedCost || s.month.fixedMealEnabled ? (
        <p className="mt-3 text-sm text-ink-2">
          {s.totals.sharedCost ? `${t.dashboard.otherCosts}: ${fmt.money(s.totals.sharedCost)}` : ""}
          {s.totals.sharedCost && s.month.fixedMealEnabled ? " · " : ""}
          {s.month.fixedMealEnabled ? `${R.fixedMeal}: ${fmt.int(s.month.fixedMealMin)} ${t.common.meals}` : ""}
        </p>
      ) : null}

      <div className="scroll-x mt-6">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-[12.5px] text-ink-2">
              <th className="rounded-l-xl px-3 py-2.5 font-semibold">{R.colName}</th>
              <th className="px-2 py-2.5 text-right font-semibold">{R.colOwn}</th>
              <th className="px-2 py-2.5 text-right font-semibold">{R.colGuest}</th>
              <th className="px-2 py-2.5 text-right font-semibold">{R.colBilled}</th>
              <th className="px-2 py-2.5 text-right font-semibold">{R.colMealCost}</th>
              <th className="px-2 py-2.5 text-right font-semibold">{R.colShared}</th>
              <th className="px-2 py-2.5 text-right font-semibold">{R.colCarry}</th>
              <th className="px-2 py-2.5 text-right font-semibold">{R.colDeposit}</th>
              <th className="rounded-r-xl px-3 py-2.5 text-right font-semibold">{R.colBalance}</th>
            </tr>
          </thead>
          <tbody>
            {s.members.map((m) => (
              <tr key={m.membershipId} className="border-b border-line">
                <td className="px-3 py-2.5 font-semibold">{m.name}</td>
                <td className="px-2 py-2.5 text-right tabular">
                  {fmt.num(m.ownMeals)}
                  {m.shortfall > 0 ? <span className="block text-[11.5px] text-turmeric-ink">min {fmt.num(m.minMeals)}</span> : null}
                </td>
                <td className="px-2 py-2.5 text-right tabular">{fmt.num(m.guestMeals)}</td>
                <td className="px-2 py-2.5 text-right font-semibold tabular">{fmt.num(m.billedMeals)}</td>
                <td className="px-2 py-2.5 text-right tabular">{fmt.money(m.mealCost)}</td>
                <td className="px-2 py-2.5 text-right tabular">{fmt.money(m.sharedCost)}</td>
                <td className="px-2 py-2.5 text-right tabular">{fmt.money(m.carryIn, { sign: true })}</td>
                <td className="px-2 py-2.5 text-right tabular">{fmt.money(m.deposit)}</td>
                <td className="px-3 py-2.5 text-right">
                  <Money value={m.balance} sign className="font-bold" />
                  <span className="block text-[11.5px] text-ink-3">{m.balance < -0.005 ? R.duePay : m.balance > 0.005 ? R.plusGet : ""}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td className="px-3 py-3">{R.total}</td>
              <td className="px-2 py-3 text-right tabular">{fmt.num(s.totals.ownMeals)}</td>
              <td className="px-2 py-3 text-right tabular">{fmt.num(s.totals.guestMeals)}</td>
              <td className="px-2 py-3 text-right tabular">{fmt.num(s.totals.billedMeals)}</td>
              <td className="px-2 py-3 text-right tabular">{fmt.money(s.totals.bazar)}</td>
              <td className="px-2 py-3 text-right tabular">{fmt.money(s.totals.sharedCost)}</td>
              <td className="px-2 py-3 text-right tabular">{fmt.money(s.totals.carryIn, { sign: true })}</td>
              <td className="px-2 py-3 text-right tabular">{fmt.money(s.totals.deposit)}</td>
              <td className="px-3 py-3 text-right text-sm">
                {s.totals.totalDue > 0.005 ? <span className="block text-due">{fmt.money(-s.totals.totalDue)}</span> : null}
                {s.totals.totalPlus > 0.005 ? <span className="block text-plus">{fmt.money(s.totals.totalPlus, { sign: true })}</span> : null}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold">{chart === "meals" ? R.chartMeals : chart === "balance" ? R.chartBalance : R.chartDaily}</h3>
          <Segmented
            size="sm"
            value={chart}
            onChange={setChart}
            options={[
              { value: "meals", label: t.common.meals },
              { value: "balance", label: R.colBalance },
              { value: "daily", label: t.common.date },
            ]}
          />
        </div>
        <div className="h-72 w-full" role="img" aria-label={chart === "meals" ? R.chartMeals : chart === "balance" ? R.chartBalance : R.chartDaily}>
          <ResponsiveContainer width="100%" height="100%">
            {chart === "balance" ? (
              <BarChart data={balData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={col.line} />
                <XAxis dataKey="name" tick={{ fill: col.ink2, fontSize: 12 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fill: col.ink3, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={tickFmt} width={56} />
                <ReferenceLine y={0} stroke={col.ink3} />
                <Tooltip cursor={{ fill: col.surface2 }} formatter={(v) => [fmt.money(Number(v), { sign: true }), R.colBalance]} contentStyle={{ borderRadius: 12, border: `1px solid ${col.line}`, background: col.surface, color: col.ink }} />
                <Bar isAnimationActive={false} dataKey="balance" radius={[6, 6, 6, 6]} maxBarSize={44}>
                  {balData.map((d, i) => (
                    <Cell key={i} fill={d.balance < 0 ? col.due : col.plus} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={chart === "meals" ? mealData : dailyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={col.line} />
                <XAxis dataKey="name" tick={{ fill: col.ink2, fontSize: 12 }} axisLine={false} tickLine={false} interval={chart === "meals" ? 0 : "preserveStartEnd"} />
                <YAxis tick={{ fill: col.ink3, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={tickFmt} width={40} />
                <Tooltip
                  cursor={{ fill: col.surface2 }}
                  formatter={(v, k) => [fmt.num(Number(v)), k === "own" ? R.colOwn : t.meals.guestShort]}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${col.line}`, background: col.surface, color: col.ink }}
                />
                <Bar isAnimationActive={false} dataKey="own" stackId="a" fill={col.leaf} maxBarSize={44} />
                <Bar isAnimationActive={false} dataKey="guest" stackId="a" fill={col.turmeric} radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        {chart !== "balance" ? (
          <p className="mt-2 flex gap-4 text-sm text-ink-2">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-leaf" /> {R.colOwn}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-turmeric" /> {t.meals.guestShort}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function NewMonthModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { t, fmt } = useI18n();
  const errText = useErrorText();
  const { messId, months } = useMess();
  const last = months[0];
  const nextY = last.month === 12 ? last.year + 1 : last.year;
  const nextM = last.month === 12 ? 1 : last.month + 1;
  const [ym, setYm] = useState(`${nextY}-${nextM}`);
  const [meals, setMeals] = useState<2 | 3>(last.mealsPerDay === 3 ? 3 : 2);
  const [fixed, setFixed] = useState(last.fixedMealEnabled);
  const [min, setMin] = useState(String(last.fixedMealMin || 40));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const R = t.reports;

  const options: { y: number; m: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const total = nextY * 12 + (nextM - 1) + i;
    options.push({ y: Math.floor(total / 12), m: (total % 12) + 1 });
  }

  async function submit() {
    setBusy(true);
    setError("");
    const [y, m] = ym.split("-").map(Number);
    try {
      const r = await api<{ month: { id: string } }>(`/api/messes/${messId}/months`, {
        method: "POST",
        body: { year: y, month: m, mealsPerDay: meals, fixedMealEnabled: fixed, fixedMealMin: fixed ? Number(min) || 0 : 0 },
      });
      onCreated(r.month.id);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={R.newMonthTitle}
      description={R.newMonthBody}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="accent" loading={busy} onClick={submit}>
            {R.newMonth}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={R.month} htmlFor="nm-month">
          <Select id="nm-month" value={ym} onChange={(e) => setYm(e.target.value)}>
            {options.map((o) => (
              <option key={`${o.y}-${o.m}`} value={`${o.y}-${o.m}`}>
                {fmt.monthName(o.y, o.m)}
              </option>
            ))}
          </Select>
        </Field>
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
        {error ? <p className="text-due" role="alert">{error}</p> : null}
      </div>
    </Modal>
  );
}

export default function ReportsPage() {
  return (
    <Suspense>
      <ReportsInner />
    </Suspense>
  );
}
