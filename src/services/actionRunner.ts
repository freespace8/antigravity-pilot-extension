import { closeTabs } from "../cdp/actions/closeTabs";
import { setSimplifyMode } from "../cdp/actions/simplify";
import { connectCDP } from "../cdp/client";
import { probeSimplifyState } from "../state/probe";
import type { AggregateActionResult, WindowAction, WindowActionResult, WindowStateSnapshot } from "../models/windowState";

type ActionRunnerDependencies = {
  connectCDP: typeof connectCDP;
  setSimplifyMode: typeof setSimplifyMode;
  closeTabs: typeof closeTabs;
  probeSimplifyState: typeof probeSimplifyState;
};

/**
 * Executes window actions without letting a single failure block the remaining targets.
 */
export class ActionRunner {
  private readonly dependencies: ActionRunnerDependencies;

  constructor(dependencies?: Partial<ActionRunnerDependencies>) {
    this.dependencies = {
      connectCDP,
      setSimplifyMode,
      closeTabs,
      probeSimplifyState,
      ...dependencies
    };
  }

  async runForAll(action: WindowAction, windows: WindowStateSnapshot[]): Promise<AggregateActionResult> {
    const results = await Promise.all(windows.map((windowState) => this.runForWindow(action, windowState)));
    const succeeded = results.filter((result) => result.ok).length;

    return {
      action,
      total: results.length,
      succeeded,
      failed: results.length - succeeded,
      results
    };
  }

  async runForWindow(action: WindowAction, windowState: WindowStateSnapshot): Promise<WindowActionResult> {
    let connection = null;

    try {
      connection = await this.dependencies.connectCDP(windowState.webSocketDebuggerUrl);

      if (action === "close-tabs") {
        const closeTabsResult = await this.dependencies.closeTabs(connection);
        if (!closeTabsResult.ok) {
          return {
            targetId: windowState.id,
            title: windowState.title,
            port: windowState.port,
            action,
            ok: false,
            state: "unknown",
            reason: closeTabsResult.reason
          };
        }

        return {
          targetId: windowState.id,
          title: windowState.title,
          port: windowState.port,
          action,
          ok: true,
          state: windowState.state,
          closedTabs: closeTabsResult.closed
        };
      }

      const simplifyResult = await this.dependencies.setSimplifyMode(connection, action);
      if (!simplifyResult.ok) {
        return {
          targetId: windowState.id,
          title: windowState.title,
          port: windowState.port,
          action,
          ok: false,
          state: "unknown",
          reason: simplifyResult.reason
        };
      }

      const state = await this.dependencies.probeSimplifyState(connection);
      return {
        targetId: windowState.id,
        title: windowState.title,
        port: windowState.port,
        action,
        ok: true,
        state
      };
    } catch (error) {
      return {
        targetId: windowState.id,
        title: windowState.title,
        port: windowState.port,
        action,
        ok: false,
        state: "unknown",
        reason: (error as Error).message
      };
    } finally {
      await connection?.close();
    }
  }
}
