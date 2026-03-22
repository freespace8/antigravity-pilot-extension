import type { DiscoveryError, DiscoveredWindowTarget } from "../types/cdp";
import type { SimplifyMode, SimplifyState } from "../state/types";

export type WindowAction = SimplifyMode | "close-tabs";

export type WindowStateSnapshot = DiscoveredWindowTarget & {
  state: SimplifyState;
  lastSeenAt: string;
  lastError?: string;
};

export type RefreshSnapshot = {
  windows: WindowStateSnapshot[];
  errors: DiscoveryError[];
  scannedAt: string;
  durationMs: number;
};

export type WindowActionResult = {
  targetId: string;
  title: string;
  port: number;
  action: WindowAction;
  ok: boolean;
  state?: SimplifyState;
  closedTabs?: number;
  reason?: string;
};

export type AggregateActionResult = {
  action: WindowAction;
  total: number;
  succeeded: number;
  failed: number;
  results: WindowActionResult[];
};
