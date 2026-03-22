import * as vscode from "../../../src/test-support/vscodeMock";
import { createExtensionController } from "../../../src/extension";
import { getGlobalMenuItems, openGlobalMenu } from "../../../src/ui/globalMenu";
import type { AggregateActionResult, RefreshSnapshot } from "../../../src/models/windowState";

const EMPTY_SNAPSHOT: RefreshSnapshot = {
  windows: [],
  errors: [],
  scannedAt: "2026-03-22T00:00:00.000Z",
  durationMs: 12
};

const FILLED_SNAPSHOT: RefreshSnapshot = {
  windows: [
    {
      id: "window-a",
      type: "page",
      title: "Window A",
      port: 9000,
      host: "127.0.0.1",
      webSocketDebuggerUrl: "ws://127.0.0.1:9000/devtools/page/a",
      state: "off",
      lastSeenAt: "2026-03-22T00:00:00.000Z"
    }
  ],
  errors: [],
  scannedAt: "2026-03-22T00:00:00.000Z",
  durationMs: 12
};

const FULL_RESULT: AggregateActionResult = {
  action: "full",
  total: 1,
  succeeded: 1,
  failed: 0,
  results: [
    {
      targetId: "window-a",
      title: "Window A",
      port: 9000,
      action: "full",
      ok: true,
      state: "full"
    }
  ]
};

describe("global menu", () => {
  test("TC-F-001: refreshes before showing the ordered top-level menu", async () => {
    vscode.__resetVscodeMock();

    const refreshService = {
      refresh: jest.fn(async () => FILLED_SNAPSHOT)
    };
    const actionRunner = {
      runForAll: jest.fn()
    };

    await openGlobalMenu({
      refreshService: refreshService as never,
      actionRunner: actionRunner as never
    });

    expect(refreshService.refresh).toHaveBeenCalledTimes(1);
    expect(vscode.window.showQuickPick).toHaveBeenCalledTimes(1);
    expect(vscode.__getLastQuickPickItems()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Apply to All: Full" }),
        expect.objectContaining({ label: "Apply to All: Light" }),
        expect.objectContaining({ label: "Apply to All: Off" }),
        expect.objectContaining({ label: "Apply to All: Close Tabs" }),
        expect.objectContaining({ label: "Select Window…" }),
        expect.objectContaining({ label: "Refresh" })
      ])
    );
  });

  test("TC-F-002: selecting Apply to All Full executes the aggregate action", async () => {
    vscode.__resetVscodeMock();
    vscode.__queueQuickPickSelection({ label: "Apply to All: Full", action: "full" });

    const refreshService = {
      refresh: jest.fn(async () => FILLED_SNAPSHOT)
    };
    const actionRunner = {
      runForAll: jest.fn(async () => FULL_RESULT)
    };

    const result = await openGlobalMenu({
      refreshService: refreshService as never,
      actionRunner: actionRunner as never
    });

    expect(actionRunner.runForAll).toHaveBeenCalledWith("full", FILLED_SNAPSHOT.windows);
    expect(result).toEqual(FULL_RESULT);
  });

  test("TC-E-001: empty snapshots still expose empty state and refresh", () => {
    expect(getGlobalMenuItems(EMPTY_SNAPSHOT)).toEqual([
      expect.objectContaining({ label: "No Antigravity windows found" }),
      expect.objectContaining({ label: "Refresh", action: "refresh" })
    ]);
  });

  test("TC-F-004: recoverOff refreshes and executes the global off action", async () => {
    vscode.__resetVscodeMock();

    const refreshService = {
      refresh: jest.fn(async () => FILLED_SNAPSHOT)
    };
    const actionRunner = {
      runForAll: jest.fn(async () => ({
        action: "off",
        total: 1,
        succeeded: 1,
        failed: 0,
        results: []
      }))
    };

    const controller = createExtensionController({
      refreshService: refreshService as never,
      actionRunner: actionRunner as never
    });

    await controller.recoverOff();

    expect(refreshService.refresh).toHaveBeenCalledTimes(1);
    expect(actionRunner.runForAll).toHaveBeenCalledWith("off", FILLED_SNAPSHOT.windows);
  });
});
