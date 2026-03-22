import { RefreshService } from "../../../src/services/refreshService";
import type { DiscoveredWindowTarget } from "../../../src/types/cdp";

const WINDOW_A: DiscoveredWindowTarget = {
  id: "window-a",
  type: "page",
  title: "Window A",
  port: 9000,
  host: "127.0.0.1",
  webSocketDebuggerUrl: "ws://127.0.0.1:9000/devtools/page/a"
};

const WINDOW_B: DiscoveredWindowTarget = {
  id: "window-b",
  type: "page",
  title: "Window B",
  port: 9001,
  host: "127.0.0.1",
  webSocketDebuggerUrl: "ws://127.0.0.1:9001/devtools/page/b"
};

describe("RefreshService", () => {
  test("TC-F-005: refresh updates the snapshot and cache with probed states", async () => {
    const service = new RefreshService({
      now: () => new Date("2026-03-22T00:00:00.000Z"),
      discoverLocalTargets: async () => ({
        targets: [WINDOW_A],
        errors: []
      }),
      connectCDP: async () => ({
        wsUrl: WINDOW_A.webSocketDebuggerUrl,
        contexts: [],
        async call() {
          return {} as never;
        },
        async close() {}
      }),
      probeSimplifyState: async () => "light"
    });

    const snapshot = await service.refresh();

    expect(snapshot.windows).toHaveLength(1);
    expect(snapshot.windows[0]).toEqual(
      expect.objectContaining({
        id: "window-a",
        state: "light"
      })
    );
    expect(service.getSnapshot().windows[0].state).toBe("light");
  });

  test("TC-E-001: refresh returns an empty snapshot when no windows are discovered", async () => {
    const service = new RefreshService({
      discoverLocalTargets: async () => ({
        targets: [],
        errors: []
      }),
      now: () => new Date("2026-03-22T00:00:00.000Z")
    });

    const snapshot = await service.refresh();

    expect(snapshot.windows).toEqual([]);
    expect(snapshot.errors).toEqual([]);
    expect(service.getSnapshot().windows).toEqual([]);
  });

  test("TC-E-003: later refresh replaces the cached window set after topology changes", async () => {
    let refreshCount = 0;
    const service = new RefreshService({
      now: () => new Date(`2026-03-22T00:00:0${refreshCount}.000Z`),
      discoverLocalTargets: async () => {
        refreshCount += 1;
        return refreshCount === 1
          ? { targets: [WINDOW_A], errors: [] }
          : { targets: [WINDOW_B], errors: [] };
      },
      connectCDP: async (wsUrl: string) => ({
        wsUrl,
        contexts: [],
        async call() {
          return {} as never;
        },
        async close() {}
      }),
      probeSimplifyState: async () => "off"
    });

    await service.refresh();
    const secondSnapshot = await service.refresh();

    expect(secondSnapshot.windows).toHaveLength(1);
    expect(secondSnapshot.windows[0].id).toBe("window-b");
    expect(service.getSnapshot().windows[0].id).toBe("window-b");
  });
});
