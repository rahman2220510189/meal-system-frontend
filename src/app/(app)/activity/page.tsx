"use client";
import useSWRInfinite from "swr/infinite";
import { History } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useMess } from "@/lib/mess";
import { Button, Empty, ErrorBox, Loading, PageHeader, Panel } from "@/components/ui";

type Log = { id: string; userName: string; action: string; meta: Record<string, unknown> | null; createdAt: string };
type Page = { logs: Log[]; hasMore: boolean };

export default function ActivityPage() {
  const { t, fmt } = useI18n();
  const { messId } = useMess();
  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<Page>((i, prev: Page | null) => {
    if (!messId) return null;
    if (i === 0) return `/api/messes/${messId}/activity?limit=40`;
    if (!prev?.hasMore) return null;
    return `/api/messes/${messId}/activity?limit=40&before=${encodeURIComponent(prev.logs[prev.logs.length - 1].createdAt)}`;
  });
  const logs = (data ?? []).flatMap((p) => p.logs);
  const hasMore = data?.[data.length - 1]?.hasMore;

  function describe(l: Log): string {
    const m = l.meta ?? {};
    const fn = t.log[l.action];
    let text = fn ? fn(m) : l.action;
    if (typeof m.amount === "number") text += ` — ${fmt.money(m.amount)}`;
    if (typeof m.member === "string" && /^(bazar|deposit)\./.test(l.action)) text += ` (${m.member})`;
    if (typeof m.date === "string" && /^(bazar|deposit|meal)\./.test(l.action)) text += `, ${fmt.date(m.date)}`;
    if (typeof m.reason === "string") text += ` · ${t.entries.reason}: ${m.reason}`;
    return text;
  }

  return (
    <div>
      <PageHeader title={t.activity.title} body={t.activity.body} />
      {error ? (
        <ErrorBox error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <Loading />
      ) : !logs.length ? (
        <Panel>
          <Empty icon={<History className="size-6" />} title={t.activity.empty} />
        </Panel>
      ) : (
        <Panel>
          <ol className="divide-y divide-line">
            {logs.map((l) => (
              <li key={l.id} className="flex gap-3 px-4 py-3 sm:px-5">
                <span className={`mt-2 size-2 shrink-0 rounded-full ${l.action.endsWith(".delete") || l.action.endsWith(".reject") || l.action === "member.remove" ? "bg-due" : l.action.endsWith(".approve") ? "bg-plus" : "bg-turmeric"}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px]">
                    <span className="font-semibold">{l.userName}</span> {describe(l)}
                  </p>
                  <p className="text-[13px] text-ink-3">{fmt.dateTime(l.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
          {hasMore ? (
            <div className="border-t border-line p-3 text-center">
              <Button variant="ghost" loading={isValidating} onClick={() => setSize(size + 1)}>
                {t.activity.loadMore}
              </Button>
            </div>
          ) : null}
        </Panel>
      )}
    </div>
  );
}
