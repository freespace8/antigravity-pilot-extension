import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("bootstrap scaffolding", () => {
  test("bootstrap: package scripts exist for typecheck and tests", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    expect(packageJson.scripts.typecheck).toBe("tsc -p tsconfig.json --noEmit");
    expect(packageJson.scripts["test:unit"]).toContain("jest --config jest.unit.config.cjs");
    expect(packageJson.scripts["test:integration"]).toContain("jest --config jest.integration.config.cjs");
  });

  test("manifest: commands and activation events are declared", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    const commands = packageJson.contributes.commands.map((entry: { command: string }) => entry.command);

    expect(commands).toEqual(expect.arrayContaining(["agPerf.openMenu", "agPerf.recoverOff"]));
    expect(packageJson.activationEvents).toEqual(
      expect.arrayContaining(["onStartupFinished", "onCommand:agPerf.openMenu", "onCommand:agPerf.recoverOff"])
    );
  });

  test("activation registers commands and shows the status bar", async () => {
    jest.resetModules();

    const vscode = await import("../src/test-support/vscodeMock");
    const extension = await import("../src/extension");

    vscode.__resetVscodeMock();

    const context = {
      subscriptions: [] as Array<{ dispose(): void }>
    };

    extension.activate(context as never);

    expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(1);
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith("agPerf.openMenu", expect.any(Function));
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith("agPerf.recoverOff", expect.any(Function));
    expect(vscode.__getStatusBarItems()[0].show).toHaveBeenCalledTimes(1);
    expect(context.subscriptions).toHaveLength(3);
  });
});
