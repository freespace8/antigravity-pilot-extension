import * as vscode from "vscode";

/**
 * Build the persistent `AG Perf` status bar entry that opens the global menu.
 */
export function createStatusBarItem(command: string, text = "AG Perf"): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.text = text;
  item.tooltip = "Open the Antigravity performance controller";
  item.command = command;
  return item;
}
