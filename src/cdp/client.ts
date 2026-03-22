import WebSocket from "ws";

import type { CdpCallParams, CdpConnection, CdpExecutionContext } from "../types/cdp";

type PendingCall = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

const RUNTIME_CONTEXT_CREATED = "Runtime.executionContextCreated";
const RUNTIME_CONTEXT_DESTROYED = "Runtime.executionContextDestroyed";
const RUNTIME_CONTEXTS_CLEARED = "Runtime.executionContextsCleared";

function toExecutionContext(payload: unknown): CdpExecutionContext | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const context = (payload as { context?: Record<string, unknown> }).context;
  if (!context || typeof context.id !== "number") {
    return null;
  }

  return {
    id: context.id,
    origin: typeof context.origin === "string" ? context.origin : "",
    name: typeof context.name === "string" ? context.name : "",
    auxData: typeof context.auxData === "object" && context.auxData !== null
      ? (context.auxData as Record<string, unknown>)
      : undefined
  };
}

/**
 * Open a WebSocket connection to a single local CDP page target.
 */
export async function connectCDP(
  wsUrl: string,
  options?: {
    openTimeoutMs?: number;
  }
): Promise<CdpConnection> {
  const openTimeoutMs = options?.openTimeoutMs ?? 3_000;
  const websocket = new WebSocket(wsUrl);
  const pending = new Map<number, PendingCall>();
  const contexts: CdpExecutionContext[] = [];
  let nextId = 1;
  let rootContextId: number | undefined;

  function upsertContext(context: CdpExecutionContext): void {
    const existingIndex = contexts.findIndex((entry) => entry.id === context.id);
    if (existingIndex >= 0) {
      contexts[existingIndex] = context;
    } else {
      contexts.push(context);
    }

    if (context.auxData?.isDefault === true && rootContextId === undefined) {
      rootContextId = context.id;
    }
  }

  function rejectPending(error: Error): void {
    for (const { reject } of pending.values()) {
      reject(error);
    }
    pending.clear();
  }

  websocket.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      if (typeof message.id === "number" && pending.has(message.id)) {
        const entry = pending.get(message.id)!;
        pending.delete(message.id);
        if (message.error) {
          entry.reject(new Error(message.error.message ?? "CDP call failed"));
        } else {
          entry.resolve(message.result);
        }
        return;
      }

      if (message.method === RUNTIME_CONTEXT_CREATED) {
        const context = toExecutionContext(message.params);
        if (context) {
          upsertContext(context);
        }
        return;
      }

      if (message.method === RUNTIME_CONTEXT_DESTROYED) {
        const contextId = message.params?.executionContextId;
        if (typeof contextId === "number") {
          const index = contexts.findIndex((entry) => entry.id === contextId);
          if (index >= 0) {
            contexts.splice(index, 1);
          }
          if (rootContextId === contextId) {
            rootContextId = undefined;
          }
        }
        return;
      }

      if (message.method === RUNTIME_CONTEXTS_CLEARED) {
        contexts.splice(0, contexts.length);
        rootContextId = undefined;
      }
    } catch (error) {
      rejectPending(error as Error);
    }
  });

  websocket.once("close", () => {
    rejectPending(new Error("CDP socket closed"));
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      websocket.terminate();
      reject(new Error(`Timed out opening CDP socket ${wsUrl}`));
    }, openTimeoutMs);

    websocket.once("open", () => {
      clearTimeout(timer);
      resolve();
    });

    websocket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });

  const call = <T = unknown>(method: string, params: CdpCallParams = {}): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const id = nextId++;
      pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject
      });
      websocket.send(JSON.stringify({ id, method, params }), (error) => {
        if (error) {
          pending.delete(id);
          reject(error);
        }
      });
    });

  await call("Runtime.enable");

  return {
    wsUrl,
    get contexts() {
      return contexts;
    },
    get rootContextId() {
      return rootContextId;
    },
    call,
    close() {
      return new Promise((resolve) => {
        if (websocket.readyState === WebSocket.CLOSED) {
          resolve();
          return;
        }

        websocket.once("close", () => resolve());
        websocket.close();
      });
    }
  };
}
