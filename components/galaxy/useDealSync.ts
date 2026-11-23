"use client";

import { useEffect, useMemo, useState } from "react";
import {
  mergeDealUpdates,
  pruneDealUpdates,
  type GalaxyDeal,
} from "@/lib/galaxy/core";

/* Live deal sync for DealSheet hosts (Deals board, Today, Money).
 *
 * The deals API returns the committed row in every write response,
 * so a successful mutation is applied locally the moment it lands —
 * the rendered deals never have to wait on router.refresh(), whose
 * RSC payload can arrive late or reflect a read that predates the
 * latest write when changes happen in rapid succession (the board
 * showing a deal in its old column after the sheet closed).
 * router.refresh() still runs in the hosts as a backstop for
 * server-computed props (insights, protections, totals); once the
 * refreshed server rows catch up with an applied write, the write
 * is pruned and server truth owns the row again. */
export function useDealSync(serverDeals: GalaxyDeal[]) {
  const [updates, setUpdates] = useState<Record<string, GalaxyDeal>>({});

  useEffect(() => {
    setUpdates((prev) => pruneDealUpdates(serverDeals, prev));
  }, [serverDeals]);

  const deals = useMemo(
    () => mergeDealUpdates(serverDeals, updates),
    [serverDeals, updates]
  );

  /** Record a committed write result (from the API response body)
   *  so it renders immediately and survives raced refreshes. */
  const applyDeal = (deal: GalaxyDeal) =>
    setUpdates((prev) => ({ ...prev, [deal.id]: deal }));

  return { deals, applyDeal };
}
