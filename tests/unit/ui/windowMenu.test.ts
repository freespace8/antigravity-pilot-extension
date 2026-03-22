import * as vscode from "../../../src/test-support/vscodeMock";
import { openWindowMenu } from "../../../src/ui/windowMenu";
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

describe("window menu", () => {
  test("TC-F-003: selecting one window runs Light only for that target", async () => {
    vscode.__resetVscodeMock();
    vscode.__queueQuickPickSelection({ target: WINDOW_A });
    vscode.__queueQuickPickSelection({ action: "light" });

    const refreshService = {
      refreshWindow: jest.fn()
    };
    const actionRunner = {
      runForWindow: jest.fn(async () => ({
        targetId: WINDOW_A.id,
        title: WINDOW_A.title,
        port: WINDOW_A.port,
        action: "light",
        ok: true,
        state: "light"
      }))
    };

    await openWindowMenu({
      windows: [WINDOW_A],
      refreshService: refreshService as never,
      actionRunner: actionRunner as never
    });

    expect(actionRunner.runForWindow).toHaveBeenCalledWith("light", WINDOW_A);
    expect(refreshService.refreshWindow).not.toHaveBeenCalled();
  });

  test("TC-F-006: Close Tabs asks for confirmation before executing", async () => {
    vscode.__resetVscodeMock();
    vscode.__queueQuickPickSelection({ target: WINDOW_A });
    vscode.__queueQuickPickSelection({ action: "close-tabs" });
    vscode.__queueWarningSelection("Continue");

    const refreshService = {
      refreshWindow: jest.fn()
    };
    const actionRunner = {
      runForWindow: jest.fn(async () => ({
        targetId: WINDOW_A.id,
        title: WINDOW_A.title,
        port: WINDOW_A.port,
        action: "close-tabs",
        ok: true,
        closedTabs: 2
      }))
    };

    await openWindowMenu({
      windows: [WINDOW_A],
      refreshService: refreshService as never,
      actionRunner: actionRunner as never
    });

    expect(vscode.window.showWarningMessage).toHaveBeenCalledTimes(1);
    expect(actionRunner.runForWindow).toHaveBeenCalledWith("close-tabs", WINDOW_A);
  });

  test("TC-ERR-003: cancelling Close Tabs stops the action before execution", async () => {
    vscode.__resetVscodeMock();
    vscode.__queueQuickPickSelection({ target: WINDOW_A });
    vscode.__queueQuickPickSelection({ action: "close-tabs" });
    vscode.__queueWarningSelection(undefined);

    const refreshService = {
      refreshWindow: jest.fn()
    };
    const actionRunner = {
      runForWindow: jest.fn()
    };

    await openWindowMenu({
      windows: [WINDOW_A],
      refreshService: refreshService as never,
      actionRunner: actionRunner as never
    });

    expect(vscode.window.showWarningMessage).toHaveBeenCalledTimes(1);
    expect(actionRunner.runForWindow).not.toHaveBeenCalled();
  });
});
