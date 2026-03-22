import * as vscode from "vscode";

/**
 * Ask for explicit confirmation before destructive actions such as `Close Tabs`.
 */
export async function confirmDangerousAction(message: string, confirmLabel = "Continue"): Promise<boolean> {
  const decision = await vscode.window.showWarningMessage(message, { modal: true }, confirmLabel);
  return decision === confirmLabel;
}
