import { ActionRunner } from "../../../src/services/actionRunner";
import type { WindowStateSnapshot } from "../../../src/models/windowState";

const WINDOW_A: WindowStateSnapshot = {
  id: "window-a",
  type: "page",
  title: "Window A",
  port: 9000,
  host: "127.0.0.1",
  webSocketDebuggerUrl: "ws://127.0.0.1:9000/devtools/page/a",
  state: "off",
  lastSeenAt: "2026-03-22T00:00:00.000Z"
};

const WINDOW_B: WindowStateSnapshot = {
  id: "window-b",
  type: "page",
  title: "Window B",
  port: 9001,
  host: "127.0.0.1",
  webSocketDebuggerUrl: "ws://127.0.0.1:9001/devtools/page/b",
  state: "off",
  lastSeenAt: "2026-03-22T00:00:00.000Z"
};

describe("ActionRunner", () => {
  test("TC-ERR-001: partial failure still aggregates success and failure counts", async () => {
    const runner = new ActionRunner({
      connectCDP: async (wsUrl: string) => {
        if (wsUrl.includes("9001")) {
          throw new Error("socket closed");
        }

        return {
          wsUrl,
          contexts: [],
          async call() {
            return {} as never;
          },
          async close() {}
        };
      },
      setSimplifyMode: async () => ({
        ok: true,
        mode: "light",
        appliedContexts: [-1]
      }),
      closeTabs: async () => ({
        ok: true,
        closed: 0
      }),
      probeSimplifyState: async () => "light"
    });

    const result = await runner.runForAll("light", [WINDOW_A, WINDOW_B]);

    expect(result.total).toBe(2);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetId: "window-a",
          ok: true,
          state: "light"
        }),
        expect.objectContaining({
          targetId: "window-b",
          ok: false,
          state: "unknown",
          reason: "socket closed"
        })
      ])
    );
  });
});
