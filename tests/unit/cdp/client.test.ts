import { WebSocketServer } from "ws";

import { connectCDP } from "../../../src/cdp/client";

function createServerPayload(id: number, result: Record<string, unknown>) {
  return JSON.stringify({ id, result });
}

describe("CDP client", () => {
  test("connects to a websocket target, enables runtime and tracks contexts", async () => {
    const server = new WebSocketServer({ port: 0 });
    const { port } = server.address() as { port: number };

    server.on("connection", (socket) => {
      socket.on("message", (rawMessage) => {
        const message = JSON.parse(rawMessage.toString());

        if (message.method === "Runtime.enable") {
          socket.send(
            JSON.stringify({
              method: "Runtime.executionContextCreated",
              params: {
                context: {
                  id: 1,
                  origin: "file://",
                  name: "default",
                  auxData: {
                    isDefault: true
                  }
                }
              }
            })
          );
        }

        socket.send(createServerPayload(message.id, { ok: true }));
      });
    });

    const connection = await connectCDP(`ws://127.0.0.1:${port}`);
    const result = await connection.call<{ ok: boolean }>("Page.enable");

    expect(result.ok).toBe(true);
    expect(connection.rootContextId).toBe(1);
    expect(connection.contexts).toEqual([
      expect.objectContaining({
        id: 1,
        name: "default"
      })
    ]);

    await connection.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
