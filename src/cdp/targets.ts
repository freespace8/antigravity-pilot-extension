import { createHash } from "node:crypto";

import type { DiscoveredWindowTarget, RawDebuggerTarget } from "../types/cdp";

export const FIXED_CDP_PORTS = [9000, 9001, 9002, 9003, 9222] as const;
export const CDP_LOCALHOST = "127.0.0.1" as const;

function createTargetId(port: number, title: string, webSocketDebuggerUrl: string): string {
  return createHash("sha1").update(`${port}:${title}:${webSocketDebuggerUrl}`).digest("hex");
}

export function isLocalDebuggerUrl(value: string): value is string {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "ws:" && parsed.hostname === CDP_LOCALHOST;
  } catch {
    return false;
  }
}

export function normalizeTarget(rawTarget: RawDebuggerTarget, port: number): DiscoveredWindowTarget | null {
  if (rawTarget.type !== "page" || typeof rawTarget.webSocketDebuggerUrl !== "string") {
    return null;
  }

  if (!isLocalDebuggerUrl(rawTarget.webSocketDebuggerUrl)) {
    return null;
  }

  const title = typeof rawTarget.title === "string" && rawTarget.title.trim().length > 0
    ? rawTarget.title.trim()
    : `Antigravity Window ${port}`;

  return {
    id: createTargetId(port, title, rawTarget.webSocketDebuggerUrl),
    type: rawTarget.type,
    title,
    url: typeof rawTarget.url === "string" ? rawTarget.url : undefined,
    port,
    host: CDP_LOCALHOST,
    webSocketDebuggerUrl: rawTarget.webSocketDebuggerUrl
  };
}
