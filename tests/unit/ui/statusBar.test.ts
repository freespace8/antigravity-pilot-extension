import { createStatusBarItem } from "../../../src/ui/statusBar";
import * as vscode from "../../../src/test-support/vscodeMock";

describe("status bar", () => {
  test("creates an AG Perf status bar item bound to the open menu command", () => {
    vscode.__resetVscodeMock();

    const item = createStatusBarItem("agPerf.openMenu");

    expect(item.text).toBe("AG Perf");
    expect(item.command).toBe("agPerf.openMenu");
    expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(1);
  });
});
