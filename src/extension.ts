import * as vscode from "vscode";

import { ActionRunner } from "./services/actionRunner";
import { RefreshService } from "./services/refreshService";
import { openGlobalMenu } from "./ui/globalMenu";
import { createStatusBarItem } from "./ui/statusBar";

export const COMMAND_OPEN_MENU = "agPerf.openMenu";
export const COMMAND_RECOVER_OFF = "agPerf.recoverOff";
export const STATUS_BAR_TEXT = "AG Perf";

function showMessage(message: string): Thenable<string | undefined> {
  return vscode.window.showInformationMessage(message);
}

export type ExtensionController = {
  openMenu(): Promise<void>;
  recoverOff(): Promise<void>;
};

export function createExtensionController(dependencies?: {
  refreshService?: RefreshService;
  actionRunner?: ActionRunner;
  onSelectWindow?: () => Promise<void>;
}): ExtensionController {
  const refreshService = dependencies?.refreshService ?? new RefreshService();
  const actionRunner = dependencies?.actionRunner ?? new ActionRunner();

  return {
    async openMenu() {
      await openGlobalMenu({
        refreshService,
        actionRunner,
        onSelectWindow: dependencies?.onSelectWindow
          ? async () => dependencies.onSelectWindow!()
          : undefined
      });
    },
    async recoverOff() {
      const snapshot = await refreshService.refresh();
      const result = await actionRunner.runForAll("off", snapshot.windows);
      await showMessage(`off: success ${result.succeeded} / failed ${result.failed}`);
    }
  };
}

export function activate(context: vscode.ExtensionContext): void {
  const controller = createExtensionController();
  const statusBarItem = createStatusBarItem(COMMAND_OPEN_MENU, STATUS_BAR_TEXT);
  const openMenuDisposable = vscode.commands.registerCommand(COMMAND_OPEN_MENU, () => controller.openMenu());
  const recoverDisposable = vscode.commands.registerCommand(COMMAND_RECOVER_OFF, () => controller.recoverOff());

  statusBarItem.show();

  context.subscriptions.push(statusBarItem, openMenuDisposable, recoverDisposable);
}

export function deactivate(): void {}
