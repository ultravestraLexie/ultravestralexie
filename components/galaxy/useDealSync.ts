"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  createDealWriteStore,
  mergeDealUpdates,
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
 * is pruned and server truth owns the row again.
 *
 * Round 2 (battAH): the applied writes live in a module-level
 * store, NOT in the host component's useState. Round 1 kept them
 * in hook state, so a host remount or state reset while a raced
 * refresh payload was being applied wiped the overlay and the
 * board rendered the payload's pre-write snapshot at first look
 * (the invoice step), self-correcting only when the next refresh
 * landed. The store survives any remount within the page session:
 * a remounted host re-derives the merged deals from it on its
 * very first render, and useSyncExternalStore guarantees no
 * render ever tears against a write applied mid-render. The
 * first post-close render is therefore deterministic on every
 * mutation path: it shows the last committed write. */
const writeStore = createDealWriteStore();

const EMPTY_WRITES: Record<string, GalaxyDeal> = {};

export function useDealSync(serverDeals: GalaxyDeal[]) {
  const updates = useSyncExternalStore(
    writeStore.subscribe,
    writeStore.snapshot,
    () => EMPTY_WRITES
  );

  useEffect(() => {
    writeStore.prune(serverDeals);
  }, [serverDeals]);

  const deals = useMemo(
    () => mergeDealUpdates(serverDeals, updates),
    [serverDeals, updates]
  );

  /** Record a committed write result (from the API response body)
   *  so it renders immediately and survives raced refreshes AND
   *  host remounts. */
  const applyDeal = (deal: GalaxyDeal) => writeStore.apply(deal);

  return { deals, applyDeal };
}
