import { discoverLocalTargets } from "../../../src/cdp/discovery";
import type { RawDebuggerTarget } from "../../../src/types/cdp";

describe("CDP discovery", () => {
  test("TC-ERR-002: skips timed-out ports and keeps healthy local targets", async () => {
    const fetcher = jest.fn(async (port: number): Promise<RawDebuggerTarget[]> => {
      if (port === 9000) {
        throw new Error("timeout on port 9000");
      }

      if (port === 9001) {
        return [
          {
            type: "page",
            title: "Healthy Window",
            webSocketDebuggerUrl: "ws://127.0.0.1:9001/devtools/page/1"
          }
        ];
      }

      return [];
    });

    const result = await discoverLocalTargets({
      ports: [9000, 9001],
      fetcher
    });

    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].title).toBe("Healthy Window");
    expect(result.errors).toEqual([
      expect.objectContaining({
        port: 9000,
        reason: "timeout"
      })
    ]);
  });

  test("TC-ERR-004: ignores non-localhost debugger targets", async () => {
    const result = await discoverLocalTargets({
      ports: [9222],
      fetcher: async () => [
        {
          type: "page",
          title: "Remote Window",
          webSocketDebuggerUrl: "ws://192.168.0.5:9222/devtools/page/remote"
        },
        {
          type: "page",
          title: "Local Window",
          webSocketDebuggerUrl: "ws://127.0.0.1:9222/devtools/page/local"
        }
      ]
    });

    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].title).toBe("Local Window");
    expect(result.targets[0].host).toBe("127.0.0.1");
    expect(result.errors).toEqual([]);
  });
});
