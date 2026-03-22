import * as vscode from "vscode";

import type { ActionRunner } from "../services/actionRunner";
import type { RefreshService } from "../services/refreshService";
import type { WindowAction, WindowStateSnapshot } from "../models/windowState";
import { confirmDangerousAction } from "./confirm";

type WindowMenuAction = WindowAction | "refresh-window";

type WindowMenuItem = vscode.QuickPickItem & {
  target?: WindowStateSnapshot;
  action?: WindowMenuAction;
};

function buildWindowItems(windows: WindowStateSnapshot[]): WindowMenuItem[] {
  return windows.map((windowState) => ({
    label: windowState.title,
    description: `Port ${windowState.port}`,
    detail: `State: ${windowState.state}`,
    target: windowState
  }));
}

function buildWindowActionItems(): WindowMenuItem[] {
  return [
    { label: "Full", action: "full" },
    { label: "Light", action: "light" },
    { label: "Off", action: "off" },
    { label: "Close Tabs", action: "close-tabs" },
    { label: "Refresh This Window", action: "refresh-window" }
  ];
}

/**
 * Execute the single-window flow: pick one window, then pick an action.
 */
export async function openWindowMenu(options: {
  windows: WindowStateSnapshot[];
  refreshService: RefreshService;
  actionRunner: ActionRunner;
}): Promise<void> {
  const pickedWindow = await vscode.window.showQuickPick<WindowMenuItem>(buildWindowItems(options.windows), {
    title: "Select Window"
  });

  if (!pickedWindow?.target) {
    return;
  }

  const pickedAction = await vscode.window.showQuickPick<WindowMenuItem>(buildWindowActionItems(), {
    title: pickedWindow.target.title
  });

  if (!pickedAction?.action) {
    return;
  }

  if (pickedAction.action === "refresh-window") {
    const refreshedWindow = await options.refreshService.refreshWindow(pickedWindow.target);
    await vscode.window.showInformationMessage(`${refreshedWindow.title}: ${refreshedWindow.state}`);
    return;
  }

  if (pickedAction.action === "close-tabs") {
    const confirmed = await confirmDangerousAction(
      `Close Tabs will close editor tabs in ${pickedWindow.target.title}.`,
      "Continue"
    );
    if (!confirmed) {
      await vscode.window.showInformationMessage("Close Tabs cancelled.");
      return;
    }
  }

  const result = await options.actionRunner.runForWindow(pickedAction.action, pickedWindow.target);
  if (result.ok) {
    const detail = pickedAction.action === "close-tabs"
      ? `closed ${result.closedTabs ?? 0}`
      : `${result.state ?? "unknown"}`;
    await vscode.window.showInformationMessage(`${pickedWindow.target.title}: ${detail}`);
    return;
  }

  await vscode.window.showInformationMessage(`${pickedWindow.target.title}: ${result.reason ?? "unknown error"}`);
}
