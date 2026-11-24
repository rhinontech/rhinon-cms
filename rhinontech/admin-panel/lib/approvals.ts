"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/** Pending decisions this person can make, by kind. Missing kinds are ones they can't approve. */
export interface ApprovalCounts {
  leave?: number;
  attendance?: number;
  reimbursements?: number;
  total: number;
}

// Every module layout mounts its own shell, so the sidebar remounts on each
// click. A short-lived cache keeps the badge from costing a request per page.
const TTL_MS = 60_000;
let cached: { at: number; value: ApprovalCounts } | null = null;
let inFlight: Promise<ApprovalCounts> | null = null;
const CHANGED = "rhinon:approvals-changed";

function load(force = false): Promise<ApprovalCounts> {
  if (!force && cached && Date.now() - cached.at < TTL_MS) return Promise.resolve(cached.value);
  if (!inFlight) {
    inFlight = apiFetch<ApprovalCounts>("/home/approvals/count")
      .then((value) => {
        cached = { at: Date.now(), value };
        return value;
      })
      .catch(() => ({ total: cached?.value.total ?? 0 }))
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/** Call after approving or rejecting something, so the badge and Home catch up at once. */
export function approvalsChanged() {
  cached = null;
  window.dispatchEvent(new Event(CHANGED));
}

/** The pending-approvals count for the sidebar badge; 0 while loading or when not allowed. */
export function useApprovalCount(enabled: boolean): number {
  const [total, setTotal] = useState(cached?.value.total ?? 0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const refresh = (force: boolean) => load(force).then((c) => active && setTotal(c.total));
    refresh(false);
    const onChange = () => refresh(true);
    window.addEventListener(CHANGED, onChange);
    return () => {
      active = false;
      window.removeEventListener(CHANGED, onChange);
    };
  }, [enabled]);

  return enabled ? total : 0;
}
