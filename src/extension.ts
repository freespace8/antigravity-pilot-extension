import * as vscode from "vscode";

export const COMMAND_OPEN_MENU = "agPerf.openMenu";
export const COMMAND_RECOVER_OFF = "agPerf.recoverOff";
export const STATUS_BAR_TEXT = "AG Perf";

function showPlaceholderMessage(message: string): Thenable<string | undefined> {
  return vscode.window.showInformationMessage(message);
}

export function createStatusBarItem(): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.text = STATUS_BAR_TEXT;
  item.tooltip = "Open the Antigravity performance controller";
  item.command = COMMAND_OPEN_MENU;
  return item;
}

export async function openMenu(): Promise<void> {
  await showPlaceholderMessage("AG Perf scaffold initialized. Menu flow will be connected in later tasks.");
}

export async function recoverOff(): Promise<void> {
  await showPlaceholderMessage("AG Perf recovery scaffold initialized. Off recovery flow will be connected in later tasks.");
}

export function activate(context: vscode.ExtensionContext): void {
  const statusBarItem = createStatusBarItem();
  const openMenuDisposable = vscode.commands.registerCommand(COMMAND_OPEN_MENU, openMenu);
  const recoverDisposable = vscode.commands.registerCommand(COMMAND_RECOVER_OFF, recoverOff);

  statusBarItem.show();

  context.subscriptions.push(statusBarItem, openMenuDisposable, recoverDisposable);
}

export function deactivate(): void {}
