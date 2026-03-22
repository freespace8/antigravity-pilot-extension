import http from "node:http";

import { CDP_LOCALHOST, FIXED_CDP_PORTS, normalizeTarget } from "./targets";
import type { DiscoveryError, DiscoveryResult, RawDebuggerTarget } from "../types/cdp";

export const DEFAULT_DISCOVERY_TIMEOUT_MS = 1500;

export type PortTargetFetcher = (port: number, timeoutMs: number) => Promise<RawDebuggerTarget[]>;

/**
 * Fetch `/json` from a local CDP port and return the raw target list.
 */
export function fetchTargetsForPort(
  port: number,
  timeoutMs = DEFAULT_DISCOVERY_TIMEOUT_MS
): Promise<RawDebuggerTarget[]> {
  return new Promise((resolve, reject) => {
    const request = http.get(
      {
        host: CDP_LOCALHOST,
        port,
        path: "/json"
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            resolve(Array.isArray(parsed) ? parsed : []);
          } catch (error) {
            reject(new Error(`invalid JSON from port ${port}: ${(error as Error).message}`));
          }
        });
      }
    );

    request.on("error", (error) => {
      reject(new Error(`request error on port ${port}: ${error.message}`));
    });

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`timeout on port ${port}`));
    });
  });
}

function mapDiscoveryError(port: number, error: Error): DiscoveryError {
  if (error.message.includes("timeout")) {
    return {
      port,
      reason: "timeout",
      message: error.message
    };
  }

  if (error.message.includes("invalid JSON")) {
    return {
      port,
      reason: "invalid-json",
      message: error.message
    };
  }

  return {
    port,
    reason: "request-error",
    message: error.message
  };
}

/**
 * Scan the fixed Antigravity CDP ports and normalize every localhost page target.
 */
export async function discoverLocalTargets(options?: {
  ports?: readonly number[];
  timeoutMs?: number;
  fetcher?: PortTargetFetcher;
}): Promise<DiscoveryResult> {
  const ports = options?.ports ?? FIXED_CDP_PORTS;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_DISCOVERY_TIMEOUT_MS;
  const fetcher = options?.fetcher ?? fetchTargetsForPort;

  const errors: DiscoveryError[] = [];
  const targets = [];

  for (const port of ports) {
    try {
      const rawTargets = await fetcher(port, timeoutMs);
      for (const rawTarget of rawTargets) {
        const normalizedTarget = normalizeTarget(rawTarget, port);
        if (normalizedTarget) {
          targets.push(normalizedTarget);
        }
      }
    } catch (error) {
      errors.push(mapDiscoveryError(port, error as Error));
    }
  }

  return {
    targets,
    errors
  };
}
