import { connectCDP } from "../cdp/client";
import { discoverLocalTargets } from "../cdp/discovery";
import { probeSimplifyState } from "../state/probe";
import type { RefreshSnapshot, WindowStateSnapshot } from "../models/windowState";
import type { DiscoveredWindowTarget } from "../types/cdp";

type RefreshDependencies = {
  discoverLocalTargets: typeof discoverLocalTargets;
  connectCDP: typeof connectCDP;
  probeSimplifyState: typeof probeSimplifyState;
  now: () => Date;
};

function createEmptySnapshot(now: Date): RefreshSnapshot {
  return {
    windows: [],
    errors: [],
    scannedAt: now.toISOString(),
    durationMs: 0
  };
}

/**
 * Single source of truth for the latest discovered windows and their probed states.
 */
export class RefreshService {
  private readonly dependencies: RefreshDependencies;

  private refreshSequence = 0;

  private latestSnapshot: RefreshSnapshot;

  constructor(dependencies?: Partial<RefreshDependencies>) {
    this.dependencies = {
      discoverLocalTargets,
      connectCDP,
      probeSimplifyState,
      now: () => new Date(),
      ...dependencies
    };
    this.latestSnapshot = createEmptySnapshot(this.dependencies.now());
  }

  getSnapshot(): RefreshSnapshot {
    return this.latestSnapshot;
  }

  async refresh(): Promise<RefreshSnapshot> {
    const refreshId = ++this.refreshSequence;
    const startedAt = this.dependencies.now();
    const discoveryResult = await this.dependencies.discoverLocalTargets();
    const scannedAt = this.dependencies.now().toISOString();

    const windows = await Promise.all(
      discoveryResult.targets.map(async (target) => this.probeWindow(target, scannedAt))
    );

    const snapshot: RefreshSnapshot = {
      windows,
      errors: discoveryResult.errors,
      scannedAt,
      durationMs: this.dependencies.now().getTime() - startedAt.getTime()
    };

    if (refreshId === this.refreshSequence) {
      this.latestSnapshot = snapshot;
    }

    return snapshot;
  }

  async refreshWindow(target: DiscoveredWindowTarget): Promise<WindowStateSnapshot> {
    const refreshedWindow = await this.probeWindow(target, this.dependencies.now().toISOString());
    const existingWindows = this.latestSnapshot.windows.filter((entry) => entry.id !== target.id);
    this.latestSnapshot = {
      ...this.latestSnapshot,
      scannedAt: this.dependencies.now().toISOString(),
      windows: [...existingWindows, refreshedWindow].sort((left, right) => left.port - right.port)
    };
    return refreshedWindow;
  }

  private async probeWindow(target: DiscoveredWindowTarget, scannedAt: string): Promise<WindowStateSnapshot> {
    let connection = null;

    try {
      connection = await this.dependencies.connectCDP(target.webSocketDebuggerUrl);
      const state = await this.dependencies.probeSimplifyState(connection);
      return {
        ...target,
        state,
        lastSeenAt: scannedAt
      };
    } catch (error) {
      return {
        ...target,
        state: "unknown",
        lastSeenAt: scannedAt,
        lastError: (error as Error).message
      };
    } finally {
      await connection?.close();
    }
  }
}
