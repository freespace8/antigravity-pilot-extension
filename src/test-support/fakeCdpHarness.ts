import type { CdpCallParams, CdpConnection, CdpExecutionContext, DiscoveredWindowTarget } from "../types/cdp";
import type { DiscoveryResult } from "../types/cdp";
import type { SimplifyState } from "../state/types";

type HarnessWindow = {
  target: DiscoveredWindowTarget;
  state: SimplifyState;
  failConnect?: boolean;
  closeTabsResult?: number;
};

type HarnessWindowInput = {
  id: string;
  title: string;
  port: number;
  state: SimplifyState;
  failConnect?: boolean;
  closeTabsResult?: number;
};

const DEFAULT_CONTEXTS: CdpExecutionContext[] = [
  {
    id: 1,
    origin: "file://",
    name: "default",
    auxData: {
      isDefault: true
    }
  }
];

/**
 * Stateful fake CDP harness for integration tests. It emulates discovery, connect,
 * probe, simplify and close-tabs behavior without requiring a real Electron window.
 */
export class FakeCdpHarness {
  private readonly windows = new Map<string, HarnessWindow>();

  constructor(inputs: HarnessWindowInput[]) {
    for (const input of inputs) {
      const target: DiscoveredWindowTarget = {
        id: input.id,
        type: "page",
        title: input.title,
        port: input.port,
        host: "127.0.0.1",
        webSocketDebuggerUrl: `ws://127.0.0.1:${input.port}/devtools/page/${input.id}`
      };

      this.windows.set(input.id, {
        target,
        state: input.state,
        failConnect: input.failConnect,
        closeTabsResult: input.closeTabsResult ?? 0
      });
    }
  }

  async discover(): Promise<DiscoveryResult> {
    return {
      targets: [...this.windows.values()].map((windowState) => windowState.target),
      errors: []
    };
  }

  async connect(wsUrl: string): Promise<CdpConnection> {
    const windowState = [...this.windows.values()].find((entry) => entry.target.webSocketDebuggerUrl === wsUrl);

    if (!windowState) {
      throw new Error(`unknown target ${wsUrl}`);
    }

    if (windowState.failConnect) {
      throw new Error("socket closed");
    }

    return {
      wsUrl,
      contexts: DEFAULT_CONTEXTS,
      rootContextId: 1,
      call: async <T = unknown>(_method: string, params?: CdpCallParams): Promise<T> => this.evaluate(windowState, params) as T,
      close: async () => {}
    };
  }

  setWindowState(windowId: string, state: SimplifyState): void {
    const windowState = this.windows.get(windowId);
    if (!windowState) {
      throw new Error(`unknown window ${windowId}`);
    }

    windowState.state = state;
  }

  private evaluate(windowState: HarnessWindow, params?: CdpCallParams) {
    const expression = String(params?.expression ?? "");

    if (expression.includes('setAttribute(modeAttribute, "light")')) {
      windowState.state = "light";
      return { result: { value: { ok: true, mode: "light" } } };
    }

    if (expression.includes('setAttribute(modeAttribute, "full")')) {
      windowState.state = "full";
      return { result: { value: { ok: true, mode: "full" } } };
    }

    if (expression.includes('removeAttribute("data-ag-perf-mode")')) {
      windowState.state = "off";
      return { result: { value: { ok: true, mode: "off" } } };
    }

    if (expression.includes("querySelectorAll('.tabs-container .tab')") || expression.includes(".tabs-container .tab-close")) {
      return { result: { value: { closed: windowState.closeTabsResult ?? 0 } } };
    }

    if (expression.includes('getAttribute("data-ag-perf-mode")')) {
      return { result: { value: { state: windowState.state } } };
    }

    return { result: { value: { ok: true } } };
  }
}
