import type { CdpConnection } from "../types/cdp";
import { SIMPLIFY_MODE_ATTRIBUTE, SIMPLIFY_STYLE_ID, type SimplifyState } from "./types";

const PROBE_SCRIPT = `(() => {
  const style = document.getElementById(${JSON.stringify(SIMPLIFY_STYLE_ID)});
  const mode = document.documentElement.getAttribute(${JSON.stringify(SIMPLIFY_MODE_ATTRIBUTE)});

  if (!style && !mode) {
    return { state: "off" };
  }

  if (mode === "light" || mode === "full") {
    return { state: mode };
  }

  return { state: "unknown" };
})()`;

/**
 * Probe the current simplify mode from the DOM marker; any execution failure degrades to `unknown`.
 */
export async function probeSimplifyState(connection: CdpConnection): Promise<SimplifyState> {
  const contextIds = connection.contexts.length > 0
    ? connection.contexts.map((context) => context.id)
    : [connection.rootContextId];

  for (const contextId of contextIds) {
    try {
      const result = await connection.call<{ result?: { value?: { state?: SimplifyState } } }>("Runtime.evaluate", {
        expression: PROBE_SCRIPT,
        returnByValue: true,
        ...(typeof contextId === "number" ? { contextId } : {})
      });

      const state = result.result?.value?.state;
      if (state === "off" || state === "light" || state === "full" || state === "unknown") {
        return state;
      }
    } catch {
      continue;
    }
  }

  return "unknown";
}
