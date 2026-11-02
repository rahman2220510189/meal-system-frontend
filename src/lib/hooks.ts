"use client";
import useSWR from "swr";
import { useMess } from "./mess";
import type { Summary } from "./types";

/** Month summary for the selected month (or a given month id). */
export function useSummary(monthId?: string | null) {
  const { messId, month } = useMess();
  const id = monthId ?? month?.id;
  return useSWR<Summary>(messId && id ? `/api/messes/${messId}/months/${id}` : null);
}
