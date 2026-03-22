import { ActionRunner } from "../../src/services/actionRunner";
import { RefreshService } from "../../src/services/refreshService";
import { FakeCdpHarness } from "../../src/test-support/fakeCdpHarness";

describe("integration: mixed simplify state", () => {
  test("TC-ST-003: all windows can go full, then one returns to off without changing the others", async () => {
    const harness = new FakeCdpHarness([
      {
        id: "window-a",
        title: "Window A",
        port: 9000,
        state: "off"
      },
      {
        id: "window-b",
        title: "Window B",
        port: 9001,
        state: "off"
      }
    ]);

    const refreshService = new RefreshService({
      discoverLocalTargets: async () => harness.discover(),
      connectCDP: async (wsUrl: string) => harness.connect(wsUrl)
    });
    const actionRunner = new ActionRunner({
      connectCDP: async (wsUrl: string) => harness.connect(wsUrl)
    });

    const initialSnapshot = await refreshService.refresh();
    await actionRunner.runForAll("full", initialSnapshot.windows);

    const fullSnapshot = await refreshService.refresh();
    expect(fullSnapshot.windows.map((windowState) => windowState.state)).toEqual(["full", "full"]);

    await actionRunner.runForWindow("off", fullSnapshot.windows[0]);

    const mixedSnapshot = await refreshService.refresh();
    expect(mixedSnapshot.windows[0].state).toBe("off");
    expect(mixedSnapshot.windows[1].state).toBe("full");
  });
});
