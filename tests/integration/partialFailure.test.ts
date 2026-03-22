import * as vscode from "../../src/test-support/vscodeMock";
import { ActionRunner } from "../../src/services/actionRunner";
import { RefreshService } from "../../src/services/refreshService";
import { FakeCdpHarness } from "../../src/test-support/fakeCdpHarness";
import { openGlobalMenu } from "../../src/ui/globalMenu";

describe("integration: partial failure aggregation", () => {
  test("TC-ERR-001: global action reports partial success when one window fails", async () => {
    vscode.__resetVscodeMock();
    vscode.__queueQuickPickSelection({ label: "Apply to All: Light", action: "light" });

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
        state: "off",
        failConnect: true
      }
    ]);

    const refreshService = new RefreshService({
      discoverLocalTargets: async () => harness.discover(),
      connectCDP: async (wsUrl: string) => harness.connect(wsUrl)
    });
    const actionRunner = new ActionRunner({
      connectCDP: async (wsUrl: string) => harness.connect(wsUrl)
    });

    const result = await openGlobalMenu({
      refreshService,
      actionRunner
    });

    expect(result).toEqual(
      expect.objectContaining({
        action: "light",
        succeeded: 1,
        failed: 1
      })
    );
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith("light: success 1 / failed 1");
  });
});
