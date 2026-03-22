import * as vscode from "vscode";

import type { ActionRunner } from "../services/actionRunner";
import type { RefreshService } from "../services/refreshService";
import type { AggregateActionResult, RefreshSnapshot, WindowAction } from "../models/windowState";

type GlobalMenuAction = WindowAction | "refresh" | "select-window";

export type GlobalMenuItem = vscode.QuickPickItem & {
  action?: GlobalMenuAction;
};

function buildActionItems(snapshot: RefreshSnapshot): GlobalMenuItem[] {
  const items: GlobalMenuItem[] = [
    { label: "Apply to All: Full", action: "full" },
    { label: "Apply to All: Light", action: "light" },
    { label: "Apply to All: Off", action: "off" },
    { label: "Apply to All: Close Tabs", action: "close-tabs" },
    { label: "Select Window…", action: "select-window" },
    { label: "Refresh", action: "refresh" }
  ];

  if (snapshot.windows.length === 0) {
    return [
      {
        label: "No Antigravity windows found",
        description: "Start Antigravity with a CDP port, then refresh."
      },
      items.at(-1)!
    ];
  }

  return items;
}

function summarizeResult(result: AggregateActionResult): string {
  return `${result.action}: success ${result.succeeded} / failed ${result.failed}`;
}

/**
 * Run the top-level QuickPick flow: refresh first, then expose all-window actions.
 */
export async function openGlobalMenu(options: {
  refreshService: RefreshService;
  actionRunner: ActionRunner;
  onSelectWindow?: (snapshot: RefreshSnapshot) => Promise<void>;
}): Promise<AggregateActionResult | RefreshSnapshot | undefined> {
  const snapshot = await options.refreshService.refresh();
  const picked = await vscode.window.showQuickPick<GlobalMenuItem>(buildActionItems(snapshot), {
    title: "AG Perf"
  });

  if (!picked?.action) {
    return undefined;
  }

  if (picked.action === "refresh") {
    return options.refreshService.refresh();
  }

  if (picked.action === "select-window") {
    if (options.onSelectWindow) {
      await options.onSelectWindow(snapshot);
    } else {
      await vscode.window.showInformationMessage("Select Window flow will be connected in the next task.");
    }
    return undefined;
  }

  if (picked.action === "close-tabs") {
    const confirmation = await vscode.window.showWarningMessage(
      "Close Tabs will close editor tabs in every discovered Antigravity window.",
      { modal: true },
      "Continue"
    );

    if (confirmation !== "Continue") {
      await vscode.window.showInformationMessage("Close Tabs cancelled.");
      return undefined;
    }
  }

  const result = await options.actionRunner.runForAll(picked.action, snapshot.windows);
  await vscode.window.showInformationMessage(summarizeResult(result));
  return result;
}

export function getGlobalMenuItems(snapshot: RefreshSnapshot): GlobalMenuItem[] {
  return buildActionItems(snapshot);
}
