import { setSimplifyMode } from "../../../src/cdp/actions/simplify";
import { probeSimplifyState } from "../../../src/state/probe";
import type { CdpCallParams, CdpConnection } from "../../../src/types/cdp";

function createStatefulConnection(initialState: "off" | "light" | "full" | "unknown" = "off"): CdpConnection {
  let currentState = initialState;

  return {
    wsUrl: "ws://127.0.0.1:9000/devtools/page/1",
    contexts: [{ id: 1, origin: "file://", name: "default", auxData: { isDefault: true } }],
    rootContextId: 1,
    async call<T = unknown>(_method: string, params?: CdpCallParams): Promise<T> {
      const expression = String(params?.expression ?? "");

      if (expression.includes('setAttribute(modeAttribute, "light")')) {
        currentState = "light";
        return { result: { value: { ok: true, mode: "light" } } } as T;
      }

      if (expression.includes('setAttribute(modeAttribute, "full")')) {
        currentState = "full";
        return { result: { value: { ok: true, mode: "full" } } } as T;
      }

      if (expression.includes('removeAttribute("data-ag-perf-mode")')) {
        currentState = "off";
        return { result: { value: { ok: true, mode: "off" } } } as T;
      }

      return {
        result: {
          value: {
            state: currentState
          }
        }
      } as T;
    },
    async close() {}
  };
}

describe("simplify actions", () => {
  test("TC-ST-001: transitions off -> light -> full -> off through the action layer", async () => {
    const connection = createStatefulConnection("off");

    expect(await probeSimplifyState(connection)).toBe("off");

    expect(await setSimplifyMode(connection, "light")).toEqual(
      expect.objectContaining({ ok: true, mode: "light" })
    );
    expect(await probeSimplifyState(connection)).toBe("light");

    expect(await setSimplifyMode(connection, "full")).toEqual(
      expect.objectContaining({ ok: true, mode: "full" })
    );
    expect(await probeSimplifyState(connection)).toBe("full");

    expect(await setSimplifyMode(connection, "off")).toEqual(
      expect.objectContaining({ ok: true, mode: "off" })
    );
    expect(await probeSimplifyState(connection)).toBe("off");
  });
});
