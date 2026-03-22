import { probeSimplifyState } from "../../../src/state/probe";
import type { CdpConnection } from "../../../src/types/cdp";

describe("state probe", () => {
  test("TC-E-002: returns unknown when Runtime.evaluate fails", async () => {
    const connection: CdpConnection = {
      wsUrl: "ws://127.0.0.1:9000/devtools/page/1",
      contexts: [{ id: 1, origin: "file://", name: "default" }],
      rootContextId: 1,
      async call() {
        throw new Error("execution context destroyed");
      },
      async close() {}
    };

    await expect(probeSimplifyState(connection)).resolves.toBe("unknown");
  });
});
