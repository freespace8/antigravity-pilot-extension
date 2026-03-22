import { closeTabs } from "../../../src/cdp/actions/closeTabs";
import type { CdpConnection } from "../../../src/types/cdp";

describe("closeTabs", () => {
  test("returns closed tab count from Runtime.evaluate", async () => {
    const connection: CdpConnection = {
      wsUrl: "ws://127.0.0.1:9000/devtools/page/1",
      contexts: [],
      rootContextId: 1,
      async call<T = unknown>() {
        return { result: { value: { closed: 3 } } } as T;
      },
      async close() {}
    };

    await expect(closeTabs(connection)).resolves.toEqual({
      ok: true,
      closed: 3
    });
  });
});
