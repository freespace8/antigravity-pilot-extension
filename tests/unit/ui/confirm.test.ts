import * as vscode from "../../../src/test-support/vscodeMock";
import { confirmDangerousAction } from "../../../src/ui/confirm";

describe("confirmDangerousAction", () => {
  test("returns true only when the confirm label is chosen", async () => {
    vscode.__resetVscodeMock();
    vscode.__queueWarningSelection("Continue");

    await expect(confirmDangerousAction("Close tabs?", "Continue")).resolves.toBe(true);
  });
});
