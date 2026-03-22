import { RefreshService } from "../../src/services/refreshService";
import { FakeCdpHarness } from "../../src/test-support/fakeCdpHarness";

describe("integration: multi-window sync", () => {
  test("TC-ST-002: a later menu refresh sees state changes made by another instance", async () => {
    const harness = new FakeCdpHarness([
      {
        id: "window-a",
        title: "Window A",
        port: 9000,
        state: "off"
      }
    ]);

    const refreshService = new RefreshService({
      discoverLocalTargets: async () => harness.discover(),
      connectCDP: async (wsUrl: string) => harness.connect(wsUrl)
    });

    const firstSnapshot = await refreshService.refresh();
    expect(firstSnapshot.windows[0].state).toBe("off");

    harness.setWindowState("window-a", "full");

    const secondSnapshot = await refreshService.refresh();
    expect(secondSnapshot.windows[0].state).toBe("full");
    expect(refreshService.getSnapshot().windows[0].state).toBe("full");
  });
});
